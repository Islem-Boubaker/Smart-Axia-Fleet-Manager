import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL missing');
}

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

const squaredDistance = (a, b) => {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng;
};

const geocodeStart = async (query) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: String(query || ''),
    limit: '1',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      'User-Agent': 'smart-axia-fleet-manager/1.0 (ops)',
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const lat = Number(data[0]?.lat);
  const lng = Number(data[0]?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

const optimizeStopOrder = async (startPoint, stops) => {
  const coordinates = [
    startPoint,
    ...stops.map((stop) => ({ lat: Number(stop.latitude), lng: Number(stop.longitude) })),
  ];

  const coordinateString = coordinates.map((point) => `${point.lng},${point.lat}`).join(';');
  const params = new URLSearchParams({
    source: 'first',
    roundtrip: 'false',
    overview: 'false',
    steps: 'false',
    geometries: 'geojson',
  });

  const response = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coordinateString}?${params.toString()}`);
  if (!response.ok) return null;

  const data = await response.json();
  if (data?.code !== 'Ok' || !Array.isArray(data?.waypoints)) return null;

  const remaining = stops.map((stop) => ({
    id: String(stop.id),
    lat: Number(stop.latitude),
    lng: Number(stop.longitude),
  }));

  const mapped = [];

  for (let inputIndex = 0; inputIndex < data.waypoints.length; inputIndex += 1) {
    const waypoint = data.waypoints[inputIndex];
    const waypointIndex = typeof waypoint?.waypoint_index === 'number' ? waypoint.waypoint_index : inputIndex;

    // source=first means waypoint_index 0 is the start point
    if (waypointIndex < 1) continue;

    let matchedIndex = -1;

    if (
      Array.isArray(waypoint?.location) &&
      waypoint.location.length === 2 &&
      Number.isFinite(waypoint.location[0]) &&
      Number.isFinite(waypoint.location[1])
    ) {
      const point = { lat: Number(waypoint.location[1]), lng: Number(waypoint.location[0]) };
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < remaining.length; i += 1) {
        const dist = squaredDistance(point, remaining[i]);
        if (dist < bestDistance) {
          bestDistance = dist;
          matchedIndex = i;
        }
      }
    }

    if (matchedIndex < 0 && remaining.length > 0) {
      matchedIndex = Math.max(0, Math.min(inputIndex - 1, remaining.length - 1));
    }

    if (matchedIndex < 0 || matchedIndex >= remaining.length) {
      continue;
    }

    const [matched] = remaining.splice(matchedIndex, 1);
    mapped.push({
      waypointIndex,
      stopId: matched.id,
    });
  }

  mapped.sort((a, b) => a.waypointIndex - b.waypointIndex);
  return mapped.map((entry) => entry.stopId);
};

const main = async () => {
  await client.connect();

  try {
    const { rows } = await client.query(`
      SELECT
        t.id,
        t."startLocation",
        json_agg(
          json_build_object(
            'id', s.id,
            'stopOrder', s."stopOrder",
            'latitude', s.latitude,
            'longitude', s.longitude
          )
          ORDER BY s."stopOrder"
        ) AS stops
      FROM trips t
      JOIN trip_stops s ON s."tripId" = t.id
      WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
      GROUP BY t.id, t."startLocation"
      HAVING COUNT(s.id) > 1
    `);

    let processed = 0;
    let updatedTrips = 0;
    let updatedStops = 0;
    let skipped = 0;
    const failures = [];

    for (const row of rows) {
      processed += 1;

      const startPoint = await geocodeStart(row.startLocation);
      if (!startPoint) {
        skipped += 1;
        continue;
      }

      const stops = Array.isArray(row.stops) ? row.stops : [];
      const optimizedStopIds = await optimizeStopOrder(startPoint, stops);

      if (!optimizedStopIds || optimizedStopIds.length !== stops.length) {
        skipped += 1;
        continue;
      }

      const currentOrder = stops.map((stop) => String(stop.id));
      const nextOrder = optimizedStopIds.map(String);

      if (JSON.stringify(currentOrder) === JSON.stringify(nextOrder)) {
        continue;
      }

      await client.query('BEGIN');
      try {
        let tripUpdatedStops = 0;

        // Move existing stopOrder values out of the way first to avoid unique conflicts.
        await client.query(
          'UPDATE trip_stops SET "stopOrder" = "stopOrder" + 1000 WHERE "tripId" = $1',
          [row.id]
        );

        for (let i = 0; i < nextOrder.length; i += 1) {
          await client.query(
            'UPDATE trip_stops SET "stopOrder" = $1 WHERE id = $2',
            [i + 1, nextOrder[i]]
          );
          tripUpdatedStops += 1;
        }

        await client.query('COMMIT');
        updatedTrips += 1;
        updatedStops += tripUpdatedStops;
      } catch (error) {
        await client.query('ROLLBACK');
        skipped += 1;
        failures.push({
          tripId: row.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log(JSON.stringify({ processed, updatedTrips, updatedStops, skipped, failures }, null, 2));
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

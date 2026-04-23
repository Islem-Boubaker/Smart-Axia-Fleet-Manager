import dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../config/connectdb.js";

const EPSILON = 0.0002;

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function close(a, b, epsilon = EPSILON) {
  return a != null && b != null && Math.abs(Number(a) - Number(b)) <= epsilon;
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    const [rows] = await sequelize.query(`
      WITH ordered AS (
        SELECT
          t.id AS trip_id,
          t."endLocation",
          t."endLatitude",
          t."endLongitude",
          s.id AS stop_id,
          s."locationName",
          s.latitude,
          s.longitude,
          s."stopOrder",
          ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY s."stopOrder" DESC) AS rn
        FROM trips t
        JOIN trip_stops s ON s."tripId" = t.id
      )
      SELECT *
      FROM ordered
      WHERE rn = 1
    `);

    const duplicates = rows.filter((row) => {
      const sameLabel = normalizeText(row.locationName) === normalizeText(row.endLocation);
      const sameCoords =
        close(row.latitude, row.endLatitude) &&
        close(row.longitude, row.endLongitude);
      return sameLabel || sameCoords;
    });

    for (const duplicate of duplicates) {
      await sequelize.transaction(async (transaction) => {
        await sequelize.query(
          `DELETE FROM trip_stops WHERE id = :stopId`,
          {
            replacements: { stopId: duplicate.stop_id },
            transaction,
          },
        );

        const [remainingStops] = await sequelize.query(
          `
            SELECT id
            FROM trip_stops
            WHERE "tripId" = :tripId
            ORDER BY "stopOrder" ASC, id ASC
          `,
          {
            replacements: { tripId: duplicate.trip_id },
            transaction,
          },
        );

        for (let index = 0; index < remainingStops.length; index += 1) {
          await sequelize.query(
            `UPDATE trip_stops SET "stopOrder" = :stopOrder WHERE id = :stopId`,
            {
              replacements: {
                stopId: remainingStops[index].id,
                stopOrder: index + 1,
              },
              transaction,
            },
          );
        }
      });

      console.log(
        `Removed duplicate final stop ${duplicate.stop_id} from trip ${duplicate.trip_id}`,
      );
    }

    console.log(JSON.stringify({ removed: duplicates.length }, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

await main();

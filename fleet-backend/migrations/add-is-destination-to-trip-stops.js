/**
 * Migration: add isDestination to trip_stops + backfill destination stops
 *
 * Run once:  node fleet-backend/migrations/add-is-destination-to-trip-stops.js
 *
 * What it does:
 *  1. Adds column `isDestination` BOOLEAN NOT NULL DEFAULT false to trip_stops
 *  2. Adds a partial unique index so only one destination stop per trip is allowed
 *  3. Backfill — for every trip that has no destination stop yet:
 *       - scheduled / ongoing  → creates a pending destination stop (stopOrder = max+1)
 *       - completed / cancelled → creates a reached destination stop for read consistency
 */

import { Sequelize, DataTypes, QueryTypes } from "sequelize";
import { sequelize } from "../config/connectdb.js";

async function up() {
  const qi = sequelize.getQueryInterface();

  // 1. Add column (idempotent: skip if already exists)
  const tableDesc = await qi.describeTable("trip_stops");
  if (!tableDesc.isDestination) {
    await qi.addColumn("trip_stops", "isDestination", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    console.log("✅ Column isDestination added to trip_stops");
  } else {
    console.log("ℹ️  Column isDestination already exists — skipping");
  }

  // 2. Partial unique index (one destination per trip)
  try {
    await sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "trip_stops_trip_destination_unique"
       ON trip_stops ("tripId")
       WHERE "isDestination" = true`
    );
    console.log("✅ Partial unique index created");
  } catch (err) {
    console.warn("⚠️  Could not create partial unique index (may already exist):", err.message);
  }

  // 3. Backfill
  const trips = await sequelize.query(
    `SELECT id, "endLocation", "endLatitude", "endLongitude", "endTime", status
     FROM trips`,
    { type: QueryTypes.SELECT }
  );

  let created = 0;
  let skipped = 0;

  for (const trip of trips) {
    // Check if destination stop already exists
    const [existing] = await sequelize.query(
      `SELECT id FROM trip_stops WHERE "tripId" = :tripId AND "isDestination" = true LIMIT 1`,
      { replacements: { tripId: trip.id }, type: QueryTypes.SELECT }
    );

    if (existing) {
      skipped++;
      continue;
    }

    // Find max stopOrder for this trip
    const [maxRow] = await sequelize.query(
      `SELECT COALESCE(MAX("stopOrder"), 0) AS max_order FROM trip_stops WHERE "tripId" = :tripId`,
      { replacements: { tripId: trip.id }, type: QueryTypes.SELECT }
    );

    const newOrder = (maxRow?.max_order ?? 0) + 1;

    // completed/cancelled → already reached for coherence; others → pending
    const destStatus = ["completed", "cancelled"].includes(trip.status) ? "reached" : "pending";
    const arrivalTime = destStatus === "reached" ? (trip.endTime ?? new Date().toISOString()) : null;

    await sequelize.query(
      `INSERT INTO trip_stops
         ("id", "tripId", "stopOrder", "locationName", "latitude", "longitude",
          "status", "arrivalTime", "estimatedArrival", "isDestination", "createdAt", "updatedAt")
       VALUES
         (gen_random_uuid(), :tripId, :stopOrder, :locationName, :latitude, :longitude,
          :status, :arrivalTime, :estimatedArrival, true, NOW(), NOW())`,
      {
        replacements: {
          tripId: trip.id,
          stopOrder: newOrder,
          locationName: trip.endLocation,
          latitude: trip.endLatitude ?? null,
          longitude: trip.endLongitude ?? null,
          status: destStatus,
          arrivalTime: arrivalTime,
          estimatedArrival: trip.endTime ?? null,
        },
        type: QueryTypes.INSERT,
      }
    );

    created++;
  }

  console.log(`✅ Backfill complete — ${created} destination stops created, ${skipped} already existed`);
  await sequelize.close();
}

up().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

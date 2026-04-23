import dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../config/connectdb.js";
import "../models/index.js";
import Trip from "../models/trip.model.js";
import TripStop from "../models/TripStop.js";

const COUNTRY_CODE = "tn";
const USER_AGENT = "SmartAxiaFleetManager/1.0 (backfill-trip-locations)";
const REQUEST_DELAY_MS = 1100;

const COUNTRY_LABELS = new Set(["tunisia", "tunisie"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanPart(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function extractPostalCode(value) {
  const match = String(value ?? "").match(/\b(\d{4,6})\b/);
  return match?.[1] ?? null;
}

function compactLocationLabel(raw) {
  const value = cleanPart(raw);
  if (!value) return "";

  const postalCode = extractPostalCode(value);
  if (!postalCode) return value;

  const parts = value
    .split(",")
    .map(cleanPart)
    .filter(Boolean)
    .filter((part) => !COUNTRY_LABELS.has(part.toLowerCase()));

  const postcodeIndex = parts.findIndex((part) => part.includes(postalCode));
  if (postcodeIndex <= 0) return value;

  for (let index = postcodeIndex - 1; index >= 0; index -= 1) {
    const candidate = parts[index];
    if (!candidate || candidate.includes(postalCode) || /^\d+$/.test(candidate)) continue;
    return `${candidate}, ${postalCode}`;
  }

  return value;
}

function formatLocationFromAddress(displayName, address = {}) {
  const postalCode = cleanPart(address.postcode);
  const cityLike = [
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.suburb,
    address.county,
    address.state_district,
    address.state,
    address.province,
    address.region,
  ]
    .map(cleanPart)
    .find(Boolean);

  if (cityLike && postalCode) return `${cityLike}, ${postalCode}`;
  if (cityLike) return cityLike;
  if (postalCode) return postalCode;

  return compactLocationLabel(displayName);
}

const reverseCache = new Map();
const searchCache = new Map();
let lastRequestAt = 0;

async function fetchJson(url) {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < REQUEST_DELAY_MS) {
    await sleep(REQUEST_DELAY_MS - elapsed);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  lastRequestAt = Date.now();

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.json();
}

async function reverseGeocode(latitude, longitude) {
  const key = `${latitude},${longitude}`;
  if (reverseCache.has(key)) return reverseCache.get(key);

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
    "accept-language": "en",
  });

  const data = await fetchJson(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
  const result = {
    label: formatLocationFromAddress(data.display_name ?? "", data.address ?? {}),
    latitude,
    longitude,
  };
  reverseCache.set(key, result);
  return result;
}

async function searchLocation(query) {
  const normalized = cleanPart(query);
  if (!normalized) return null;
  if (searchCache.has(normalized)) return searchCache.get(normalized);

  const params = new URLSearchParams({
    format: "jsonv2",
    q: normalized,
    limit: "1",
    addressdetails: "1",
    countrycodes: COUNTRY_CODE,
    "accept-language": "en",
  });

  const data = await fetchJson(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  const first = Array.isArray(data) ? data[0] : null;

  if (!first?.lat || !first?.lon) {
    searchCache.set(normalized, null);
    return null;
  }

  const latitude = Number.parseFloat(first.lat);
  const longitude = Number.parseFloat(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    searchCache.set(normalized, null);
    return null;
  }

  const result = {
    label: formatLocationFromAddress(first.display_name ?? normalized, first.address ?? {}),
    latitude,
    longitude,
  };

  searchCache.set(normalized, result);
  return result;
}

async function backfillStops() {
  const stops = await TripStop.findAll();
  let updated = 0;

  for (const stop of stops) {
    const latitude = stop.get("latitude");
    const longitude = stop.get("longitude");
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    try {
      const resolved = await reverseGeocode(latitude, longitude);
      if (resolved?.label && resolved.label !== stop.locationName) {
        await stop.update({ locationName: resolved.label });
        updated += 1;
        console.log(`Updated stop ${stop.id}: ${stop.locationName} -> ${resolved.label}`);
      }
    } catch (error) {
      console.warn(`Failed to backfill stop ${stop.id}:`, error.message);
    }
  }

  return updated;
}

async function backfillTrips() {
  const trips = await Trip.findAll();
  let updated = 0;

  for (const trip of trips) {
    const updates = {};

    try {
      const startResolved =
        Number.isFinite(trip.startLatitude) && Number.isFinite(trip.startLongitude)
          ? await reverseGeocode(trip.startLatitude, trip.startLongitude)
          : await searchLocation(trip.startLocation);

      if (startResolved) {
        if (startResolved.label && startResolved.label !== trip.startLocation) {
          updates.startLocation = startResolved.label;
        }
        if (!Number.isFinite(trip.startLatitude)) updates.startLatitude = startResolved.latitude;
        if (!Number.isFinite(trip.startLongitude)) updates.startLongitude = startResolved.longitude;
      }
    } catch (error) {
      console.warn(`Failed to backfill start for trip ${trip.id}:`, error.message);
    }

    try {
      const endResolved =
        Number.isFinite(trip.endLatitude) && Number.isFinite(trip.endLongitude)
          ? await reverseGeocode(trip.endLatitude, trip.endLongitude)
          : await searchLocation(trip.endLocation);

      if (endResolved) {
        if (endResolved.label && endResolved.label !== trip.endLocation) {
          updates.endLocation = endResolved.label;
        }
        if (!Number.isFinite(trip.endLatitude)) updates.endLatitude = endResolved.latitude;
        if (!Number.isFinite(trip.endLongitude)) updates.endLongitude = endResolved.longitude;
      }
    } catch (error) {
      console.warn(`Failed to backfill end for trip ${trip.id}:`, error.message);
    }

    if (Object.keys(updates).length > 0) {
      await trip.update(updates);
      updated += 1;
      console.log(`Updated trip ${trip.id}`, updates);
    }
  }

  return updated;
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    const updatedStops = await backfillStops();
    const updatedTrips = await backfillTrips();

    console.log(JSON.stringify({ updatedStops, updatedTrips }, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

await main();

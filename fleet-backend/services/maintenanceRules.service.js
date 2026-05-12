/**
 * Deterministic rule engine that flags maintenance needs before calling Gemini.
 * Run this first — a real mechanic doesn't need AI for obvious cases.
 */

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Returns a positive mileage delta or null if data is invalid (negative last value, etc.)
 */
function safeDelta(currentMileage, lastMileage) {
    if (lastMileage == null || lastMileage < 0) return null;
    const delta = currentMileage - lastMileage;
    return delta < 0 ? null : delta;
}

/**
 * @param {object} vehicle - plain vehicle object (vehicle.toJSON())
 * @returns {Array<{component: string, severity: 'HIGH'|'MEDIUM'|'LOW', note?: string, kmOverdue?: number}>}
 */
export function computeMaintenanceFlags(vehicle) {
    const flags = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const age = vehicle.year ? currentYear - vehicle.year : null;
    const mileage = vehicle.mileage ?? 0;

    // ── Engine oil: every 10,000–15,000 km ──────────────────────────────────
    const kmSinceOil = safeDelta(mileage, vehicle.last_oil_change_mileage);
    if (kmSinceOil != null) {
        if (kmSinceOil > 15000) {
            flags.push({ component: 'engine_oil', severity: 'HIGH', kmOverdue: kmSinceOil - 15000 });
        } else if (kmSinceOil > 10000) {
            flags.push({ component: 'engine_oil', severity: 'MEDIUM' });
        }
    }

    // ── Tires: every 40,000–50,000 km OR 6 years (rubber degradation) ───────
    const kmSinceTires = safeDelta(mileage, vehicle.last_tire_change_mileage);
    const tireAge = vehicle.tire_age ?? null;
    if (tireAge != null && tireAge >= 10) {
        flags.push({ component: 'tires', severity: 'HIGH', note: `Tire rubber is ${tireAge} years old — exceeds safe lifespan of 6–10 years` });
    } else if (kmSinceTires != null && kmSinceTires > 60000) {
        flags.push({ component: 'tires', severity: 'HIGH', note: `${kmSinceTires} km since last tire change` });
    } else if (tireAge != null && tireAge >= 6) {
        flags.push({ component: 'tires', severity: 'MEDIUM', note: `Tire rubber is ${tireAge} years old` });
    } else if (kmSinceTires != null && kmSinceTires > 45000) {
        flags.push({ component: 'tires', severity: 'MEDIUM' });
    }

    // ── Brakes: every 40,000–60,000 km, or by age ───────────────────────────
    const kmSinceBrakes = safeDelta(mileage, vehicle.last_brake_change_mileage);
    const brakeAge = vehicle.brake_age ?? null;
    if (kmSinceBrakes != null && kmSinceBrakes > 70000) {
        flags.push({ component: 'brakes', severity: 'HIGH', kmOverdue: kmSinceBrakes - 60000 });
    } else if (kmSinceBrakes != null && kmSinceBrakes > 50000) {
        flags.push({ component: 'brakes', severity: 'MEDIUM' });
    }
    if (brakeAge != null && brakeAge >= 5 && !flags.some(f => f.component === 'brakes' && f.severity === 'HIGH')) {
        flags.push({ component: 'brakes', severity: 'HIGH', note: `Brake components are ${brakeAge} years old — replace immediately` });
    } else if (brakeAge != null && brakeAge >= 3 && !flags.some(f => f.component === 'brakes')) {
        flags.push({ component: 'brakes', severity: 'MEDIUM', note: `Brake pads are ${brakeAge} years old` });
    }

    // ── Battery: 3–5 year lifespan, shorter in hot climates ─────────────────
    if (vehicle.last_battery_change_date) {
        const batteryAgeMonths = (now - new Date(vehicle.last_battery_change_date)) / MS_PER_MONTH;
        if (batteryAgeMonths > 48) {
            flags.push({ component: 'battery', severity: 'HIGH', note: `Battery is ${Math.floor(batteryAgeMonths / 12)} years old` });
        } else if (batteryAgeMonths > 36 && vehicle.climate_zone === 'hot_dry') {
            flags.push({ component: 'battery', severity: 'MEDIUM', note: 'Battery age >3 years in hot_dry climate accelerates degradation' });
        }
    }

    // ── Technical inspection expiry ──────────────────────────────────────────
    if (vehicle.tech_visit_expiry_date) {
        const daysToExpiry = (new Date(vehicle.tech_visit_expiry_date) - now) / MS_PER_DAY;
        if (daysToExpiry < 0) {
            flags.push({ component: 'technical_inspection', severity: 'HIGH', note: 'EXPIRED — vehicle cannot legally operate on public roads' });
        } else if (daysToExpiry < 30) {
            flags.push({ component: 'technical_inspection', severity: 'MEDIUM', note: `Expires in ${Math.ceil(daysToExpiry)} days` });
        }
    }

    // ── Insurance expiry ─────────────────────────────────────────────────────
    if (vehicle.insurance_expiry_date) {
        const daysToExpiry = (new Date(vehicle.insurance_expiry_date) - now) / MS_PER_DAY;
        if (daysToExpiry < 0) {
            flags.push({ component: 'insurance', severity: 'HIGH', note: 'EXPIRED — legal liability risk' });
        } else if (daysToExpiry < 30) {
            flags.push({ component: 'insurance', severity: 'MEDIUM', note: `Expires in ${Math.ceil(daysToExpiry)} days` });
        }
    }

    // ── Coolant: every 2 years or 60,000 km ─────────────────────────────────
    if (vehicle.coolant_last_change_date) {
        const coolantMonths = (now - new Date(vehicle.coolant_last_change_date)) / MS_PER_MONTH;
        if (coolantMonths > 24) {
            flags.push({ component: 'coolant', severity: 'MEDIUM', note: `Coolant last changed ${Math.floor(coolantMonths)} months ago` });
        }
    }

    // ── Timing belt: high risk on older, high-mileage vehicles ──────────────
    if (age != null && age >= 5 && mileage > 100000) {
        flags.push({
            component: 'timing_belt',
            severity: 'HIGH',
            note: 'Inspect timing belt and tensioner — failure destroys engine on interference engines',
        });
    }

    return flags;
}

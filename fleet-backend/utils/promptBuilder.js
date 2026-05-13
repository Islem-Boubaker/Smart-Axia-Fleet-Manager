/**
 * Returns a human-readable mileage delta string, guarding against bad data
 * (negative stored values, mileage less than last service mileage).
 */
function safeDeltaLabel(currentMileage, lastMileage) {
    if (lastMileage == null || lastMileage < 0) return 'unknown (invalid stored value)';
    const delta = currentMileage - lastMileage;
    if (delta < 0) return 'unknown (mileage inconsistency)';
    return `${delta} km ago`;
}

/**
 * Normalizes reported_issues_text regardless of whether it was stored
 * as a PostgreSQL array or a legacy JSON string "[]".
 */
function parseIssues(raw) {
    if (Array.isArray(raw)) return raw.length > 0 ? raw.join(', ') : 'none';
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed.join(', ') : 'none';
        } catch {
            return raw || 'none';
        }
    }
    return 'none';
}

/**
 * Builds the Gemini prompt for vehicle maintenance analysis.
 *
 * @param {object} car  - plain vehicle object (vehicle.toJSON())
 * @param {Array}  flags - output of computeMaintenanceFlags(car)
 * @returns {string}
 */
export function buildCarPrompt(car, flags = []) {
    const currentYear = new Date().getFullYear();
    const age = car.year ? currentYear - car.year : 'unknown';
    const mileage = car.mileage ?? 0;

    const flagsText =
        flags.length > 0
            ? flags
                  .map(
                      (f) =>
                          `- ${f.component} (severity: ${f.severity})` +
                          (f.note ? ` — ${f.note}` : '') +
                          (f.kmOverdue ? ` — ${f.kmOverdue} km overdue` : '')
                  )
                  .join('\n')
            : 'No deterministic flags raised — perform contextual analysis only.';

    return `
You are a senior automotive diagnostic engineer with 20+ years of workshop experience in North African climates (hot, dusty, high humidity coastal zones).

# VEHICLE
${car.brand || 'Unknown'} ${car.model || ''} (${car.year || 'unknown year'})
Type: ${car.vehicle_type} | Fuel: ${car.fuel_type || 'unknown'} | Transmission: ${car.transmission_type || 'unknown'}
Mileage: ${mileage} km | Engine: ${car.engine_size || 'unknown'} cc
Climate: ${car.climate_zone || 'hot_dry'} | Driving profile: ${car.driving_profile || 'mixed'}
Daily usage: ${car.avg_daily_km || 'unknown'} km/day | Age: ${age} years

# SERVICE HISTORY
- Last service: ${car.last_service_date || 'unknown'}
- Oil changed at: ${car.last_oil_change_mileage ?? 'unknown'} km (${safeDeltaLabel(mileage, car.last_oil_change_mileage)})
- Tires changed at: ${car.last_tire_change_mileage ?? 'unknown'} km (${safeDeltaLabel(mileage, car.last_tire_change_mileage)}) | Tire age: ${car.tire_age ?? 'unknown'} years
- Brakes changed at: ${car.last_brake_change_mileage ?? 'unknown'} km (${safeDeltaLabel(mileage, car.last_brake_change_mileage)}) | Brake age: ${car.brake_age ?? 'unknown'} years
- Battery last changed: ${car.last_battery_change_date || 'unknown'} | Battery status: ${car.battery_status ?? 'unknown'}
- Coolant last changed: ${car.coolant_last_change_date || 'unknown'}
- AC last serviced: ${car.ac_last_service_date || 'unknown'}

# INCIDENTS
- Accidents: ${car.accident_count ?? 0}
- Reported issues: ${parseIssues(car.reported_issues_text)}

# COMPLIANCE
- Insurance expiry: ${car.insurance_expiry_date || 'unknown'}
- Technical visit expiry: ${car.tech_visit_expiry_date || 'unknown'}

# DETERMINISTIC FLAGS RAISED BY THE SYSTEM
${flagsText}

# TASK
Analyze the vehicle data and the deterministic flags above. Return the SINGLE most critical maintenance action required NOW.

## RULES
1. Return EXACTLY ONE recommendation — the most urgent one.
2. Use IMPERATIVE mechanical language (e.g., "Replace front brake pads and inspect rotors for scoring").
3. Reference SPECIFIC components (brake pads, timing belt tensioner, water pump, fuel filter, glow plugs for diesel, etc.).
4. Level rules:
   - HIGH = safety risk OR imminent engine/transmission damage OR legal expiry (insurance/tech visit)
   - MEDIUM = wear approaching service interval, no immediate danger
   - LOW = preventive only, vehicle in good condition
5. Provide a 1-sentence justification grounded in the specific data point that triggered this recommendation.
6. FORBIDDEN words: "maybe", "possibly", "consider", "might", "could", "check everything".
7. If flags array is empty AND vehicle is well-maintained, return LOW with overview "Vehicle is in compliant condition. Continue scheduled servicing."

## OUTPUT — STRICT JSON ONLY, NO MARKDOWN, NO PROSE
{
  "recommendations": [
    {
      "overview": "<imperative mechanical action>",
      "justification": "<one sentence citing the specific data point>",
      "level": "HIGH",
      "component": "<specific component name>",
      "estimated_urgency_days": 0
    }
  ]
}
`.trim();
}

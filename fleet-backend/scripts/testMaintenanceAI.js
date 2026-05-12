/**
 * Smoke-tests the full maintenance AI pipeline on 6 representative vehicles.
 *
 * Does NOT hit the database — runs against in-memory fixtures so it can be
 * executed without a running Sequelize connection.
 *
 * Run with:
 *   node fleet-backend/scripts/testMaintenanceAI.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { computeMaintenanceFlags } from '../services/maintenanceRules.service.js';
import { buildCarPrompt } from '../utils/promptBuilder.js';
import { callGeminiAndParse } from '../services/geminiService.js';
import validateAndFill from '../utils/validateAndFill.js';

// ── Sample vehicles ──────────────────────────────────────────────────────────
const VEHICLES = [
    {
        name: 'Toyota Hilux',
        brand: 'Toyota', model: 'Hilux', year: 2015,
        vehicle_type: 'Truck', fuel_type: 'diesel', transmission_type: 'manual',
        mileage: 45000, engine_size: 2500,
        climate_zone: 'hot_dry', driving_profile: 'mixed', avg_daily_km: 80,
        tire_age: 4, brake_age: 12,
        last_oil_change_mileage: 38000,
        last_tire_change_mileage: 30000,
        last_brake_change_mileage: 20000,
        last_battery_change_date: '2020-01-01',
        coolant_last_change_date: '2022-06-01',
        ac_last_service_date: null,
        insurance_expiry_date: '2026-12-01',
        tech_visit_expiry_date: '2026-08-01',
        accident_count: 1,
        reported_issues_text: ['engine noise'],
        expected_level: 'HIGH',
        expected_component_hint: 'brakes',
    },
    {
        name: 'Peugeot Partner',
        brand: 'Peugeot', model: 'Partner', year: 2016,
        vehicle_type: 'Van', fuel_type: 'diesel', transmission_type: 'manual',
        mileage: 120000, engine_size: 1600,
        climate_zone: 'humid', driving_profile: 'city', avg_daily_km: 50,
        tire_age: 3, brake_age: 2,
        last_oil_change_mileage: 110000,
        last_tire_change_mileage: 100000,
        last_brake_change_mileage: 80000,
        last_battery_change_date: '2019-05-01',
        coolant_last_change_date: '2021-01-01',
        ac_last_service_date: null,
        insurance_expiry_date: '2026-06-01',
        tech_visit_expiry_date: '2025-11-01',
        accident_count: 0,
        reported_issues_text: [],
        expected_level: 'HIGH',
        expected_component_hint: 'timing_belt',
    },
    {
        name: 'Truck Alpha',
        brand: 'Isuzu', model: 'D-Max', year: 2010,
        vehicle_type: 'Truck', fuel_type: 'diesel', transmission_type: 'manual',
        mileage: 200000, engine_size: 3000,
        climate_zone: 'hot_dry', driving_profile: 'highway', avg_daily_km: 120,
        tire_age: 14, brake_age: 3,
        last_oil_change_mileage: 195000,
        last_tire_change_mileage: 150000,
        last_brake_change_mileage: 180000,
        last_battery_change_date: '2022-01-01',
        coolant_last_change_date: '2023-01-01',
        ac_last_service_date: null,
        insurance_expiry_date: '2026-09-01',
        tech_visit_expiry_date: '2026-03-01',
        accident_count: 2,
        reported_issues_text: [],
        expected_level: 'HIGH',
        expected_component_hint: 'tires',
    },
    {
        name: 'Ford Transit (good condition)',
        brand: 'Ford', model: 'Transit', year: 2022,
        vehicle_type: 'Van', fuel_type: 'diesel', transmission_type: 'manual',
        mileage: 25000, engine_size: 2000,
        climate_zone: 'temperate', driving_profile: 'highway', avg_daily_km: 60,
        tire_age: 2, brake_age: 2,
        last_oil_change_mileage: 20000,
        last_tire_change_mileage: 10000,
        last_brake_change_mileage: 10000,
        last_battery_change_date: '2023-06-01',
        coolant_last_change_date: '2024-01-01',
        ac_last_service_date: '2024-05-01',
        insurance_expiry_date: '2027-01-01',
        tech_visit_expiry_date: '2027-06-01',
        accident_count: 0,
        reported_issues_text: [],
        expected_level: 'LOW',
        expected_component_hint: null,
    },
    {
        name: 'Renault Kangoo (oil overdue)',
        brand: 'Renault', model: 'Kangoo', year: 2018,
        vehicle_type: 'Van', fuel_type: 'diesel', transmission_type: 'manual',
        mileage: 95000, engine_size: 1500,
        climate_zone: 'hot_dry', driving_profile: 'city', avg_daily_km: 40,
        tire_age: 2, brake_age: 1,
        last_oil_change_mileage: 78000,
        last_tire_change_mileage: 80000,
        last_brake_change_mileage: 85000,
        last_battery_change_date: '2021-03-01',
        coolant_last_change_date: '2023-09-01',
        ac_last_service_date: null,
        insurance_expiry_date: '2026-10-01',
        tech_visit_expiry_date: '2026-11-01',
        accident_count: 0,
        reported_issues_text: '["AC weak"]',
        expected_level: 'HIGH',
        expected_component_hint: 'engine_oil',
    },
    {
        name: 'Mercedes Sprinter (insurance expired)',
        brand: 'Mercedes', model: 'Sprinter', year: 2019,
        vehicle_type: 'Van', fuel_type: 'diesel', transmission_type: 'automatic',
        mileage: 60000, engine_size: 2200,
        climate_zone: 'humid', driving_profile: 'highway', avg_daily_km: 90,
        tire_age: 3, brake_age: 2,
        last_oil_change_mileage: 55000,
        last_tire_change_mileage: 50000,
        last_brake_change_mileage: 45000,
        last_battery_change_date: '2022-07-01',
        coolant_last_change_date: '2023-12-01',
        ac_last_service_date: '2024-01-01',
        insurance_expiry_date: '2024-01-01',
        tech_visit_expiry_date: '2027-01-01',
        accident_count: 0,
        reported_issues_text: [],
        expected_level: 'HIGH',
        expected_component_hint: 'insurance',
    },
];

// ── Test runner ──────────────────────────────────────────────────────────────

async function testVehicle(vehicle) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🚗 ${vehicle.name}`);

    const flags = computeMaintenanceFlags(vehicle);
    console.log(`   Flags raised: ${flags.length > 0 ? flags.map(f => `${f.component}(${f.severity})`).join(', ') : 'none'}`);

    const prompt = buildCarPrompt(vehicle, flags);
    const aiResult = await callGeminiAndParse(prompt);
    const validated = validateAndFill(aiResult);

    const rec = validated.recommendation;
    const passed_level = rec.level === vehicle.expected_level;
    const passed_component =
        !vehicle.expected_component_hint ||
        (rec.component || '').toLowerCase().includes(vehicle.expected_component_hint) ||
        (rec.overview || '').toLowerCase().includes(vehicle.expected_component_hint);

    console.log(`   Level:     ${rec.level}  ${passed_level ? '✅' : `❌ (expected ${vehicle.expected_level})`}`);
    console.log(`   Component: ${rec.component || 'n/a'}  ${passed_component ? '✅' : `❌ (expected hint: ${vehicle.expected_component_hint})`}`);
    console.log(`   Overview:  ${rec.overview}`);
    console.log(`   Justification: ${rec.justification || '—'}`);
    console.log(`   Urgency:   ${rec.estimated_urgency_days ?? '?'} days`);

    return { name: vehicle.name, passed: passed_level && passed_component, rec };
}

async function main() {
    console.log('═'.repeat(60));
    console.log('  Maintenance AI — Integration Test');
    console.log('═'.repeat(60));

    const results = [];
    for (const v of VEHICLES) {
        try {
            const result = await testVehicle(v);
            results.push(result);
        } catch (err) {
            console.error(`\n❌ ${v.name} threw an error:`, err.message);
            results.push({ name: v.name, passed: false, error: err.message });
        }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log('  Summary');
    console.log('═'.repeat(60));
    const passed = results.filter(r => r.passed).length;
    for (const r of results) {
        console.log(`  ${r.passed ? '✅' : '❌'}  ${r.name}`);
    }
    console.log(`\n  ${passed}/${results.length} passed`);
    process.exit(passed === results.length ? 0 : 1);
}

main();

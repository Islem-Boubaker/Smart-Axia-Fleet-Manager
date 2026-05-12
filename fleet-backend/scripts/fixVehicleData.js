/**
 * Data integrity migration script.
 *
 * Fixes two classes of bad vehicle data found in production:
 *   1. Negative last_*_change_mileage values → set to NULL
 *   2. reported_issues_text stored as JSON string "[]" → set to empty array {}
 *
 * Run with:
 *   node --experimental-vm-modules fleet-backend/scripts/fixVehicleData.js
 * or (with package.json type:module):
 *   node fleet-backend/scripts/fixVehicleData.js
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: (sql) => console.log('[SQL]', sql),
    dialectOptions: {
        ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    },
});

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database\n');

        // ── 1. Fix negative mileage milestones ──────────────────────────────
        const mileageCols = [
            'last_oil_change_mileage',
            'last_tire_change_mileage',
            'last_brake_change_mileage',
        ];

        for (const col of mileageCols) {
            const [, meta] = await sequelize.query(
                `UPDATE vehicles SET "${col}" = NULL WHERE "${col}" < 0 RETURNING id, name, "${col}"`
            );
            console.log(`Fixed ${meta.rowCount ?? 0} rows with negative ${col}`);
        }

        // ── 2. Fix reported_issues_text stored as JSON string ───────────────
        // PostgreSQL ARRAY columns sometimes receive a text value like '[]' or '["noise"]'
        // when inserted from older code paths. Cast them back to proper arrays.
        const [badRows] = await sequelize.query(`
            SELECT id, name, reported_issues_text
            FROM vehicles
            WHERE reported_issues_text::text LIKE '"%'
               OR reported_issues_text::text = '{}'
        `);

        console.log(`\nFound ${badRows.length} rows with string-encoded reported_issues_text`);

        for (const row of badRows) {
            let parsed = [];
            try {
                const raw = row.reported_issues_text;
                // Sequelize may already deserialize to string; handle both
                const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
                parsed = JSON.parse(str);
                if (!Array.isArray(parsed)) parsed = [];
            } catch {
                parsed = [];
            }

            // Convert JS array → PostgreSQL array literal: {"item1","item2"}
            const pgArray =
                parsed.length > 0
                    ? `{${parsed.map((s) => `"${String(s).replace(/"/g, '\\"')}"`).join(',')}}`
                    : '{}';

            await sequelize.query(
                `UPDATE vehicles SET reported_issues_text = ARRAY[${parsed.map(() => '?').join(',')}]::text[] WHERE id = ?`,
                { replacements: [...parsed, row.id] }
            );

            console.log(`  Fixed vehicle "${row.name}" (${row.id}) → [${parsed.join(', ')}]`);
        }

        console.log('\n✅ Migration complete');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

run();

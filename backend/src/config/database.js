import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;
let embeddedDb;
let embeddedServer;
let initialization;

export const pool = new Pool({
  connectionString: env.USE_EMBEDDED_DATABASE
    ? `postgresql://postgres:postgres@127.0.0.1:${env.EMBEDDED_DATABASE_PORT}/postgres`
    : env.DATABASE_URL || undefined,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
});

export async function initializeDatabase() {
  if (!env.USE_EMBEDDED_DATABASE) return;
  if (!initialization) initialization = initializeEmbeddedDatabase();
  await initialization;
}

async function initializeEmbeddedDatabase() {
  embeddedDb = new PGlite({
    dataDir: env.EMBEDDED_DATABASE_DIR,
    extensions: { pgcrypto },
  });

  const initialized = await embeddedDb.query("SELECT to_regclass('public.users') IS NOT NULL AS ready");
  if (!initialized.rows[0].ready) {
    const migrationPath = fileURLToPath(new URL('../../migrations/0001_init.sql', import.meta.url));
    const migration = await readFile(migrationPath, 'utf8');
    await embeddedDb.exec(`BEGIN;\n${migration}\nCOMMIT;`);
  }

  await seedEmbeddedDemoData();

  embeddedServer = new PGLiteSocketServer({
    db: embeddedDb,
    host: '127.0.0.1',
    port: env.EMBEDDED_DATABASE_PORT,
    maxConnections: 10,
  });
  await embeddedServer.start();
}

async function seedEmbeddedDemoData() {
  const organizations = await embeddedDb.query(
    `SELECT o.id AS organization_id, (
       SELECT u.id FROM users u
       WHERE u.organization_id = o.id AND u.is_active = true
       ORDER BY u.created_at ASC LIMIT 1
     ) AS created_by
     FROM organizations o
     WHERE EXISTS (SELECT 1 FROM users u WHERE u.organization_id = o.id AND u.is_active = true)
       AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.organization_id = o.id)`,
  );

  for (const organization of organizations.rows) {
    await embeddedDb.transaction((transaction) => seedOrganizationStarterData(
      transaction,
      organization.organization_id,
      organization.created_by,
    ));
  }
}

export async function seedOrganizationStarterData(database, organizationId, createdBy) {
  const existing = await database.query('SELECT 1 FROM stores WHERE organization_id = $1 LIMIT 1', [organizationId]);
  if (existing.rowCount) return;

  const storeResult = await database.query(
    `INSERT INTO stores (organization_id, created_by, name, address_line_1, city, state_region, country, postal_code, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
     RETURNING id`,
    [organizationId, createdBy, 'ShelfSight Demo Market', '401 Pine Street', 'Seattle', 'Washington', 'United States', '98101'],
  );
  const storeId = storeResult.rows[0].id;
  const shelves = [
    ['Fresh Produce', 'Produce', 'A1', 'Fresh fruit and vegetables near the store entrance.', 'Apples, bananas, leafy greens, tomatoes'],
    ['Beverages', 'Beverages', 'B3', 'Cold and ambient drinks across the center aisle.', 'Water, sparkling water, juice, soft drinks'],
    ['Pantry Staples', 'Grocery', 'C2', 'Packaged pantry staples and meal basics.', 'Pasta, rice, canned tomatoes, cooking oil'],
  ];

  for (const [name, category, aisleCode, description, expectedProducts] of shelves) {
    await database.query(
      `INSERT INTO shelves (store_id, organization_id, created_by, name, category, aisle_code, description, expected_products)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [storeId, organizationId, createdBy, name, category, aisleCode, description, expectedProducts],
    );
  }
}

export async function testDatabaseConnection() {
  try {
    await initializeDatabase();
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function closeDatabase() {
  if (embeddedServer) await embeddedServer.stop();
  await pool.end();
  if (embeddedDb) await embeddedDb.close();
}

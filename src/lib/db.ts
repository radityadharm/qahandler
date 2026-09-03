import "server-only";

import { neon } from "@neondatabase/serverless";

/**
 * Antarmuka query minimal yang dipakai seluruh aplikasi: tagged template yang
 * mengembalikan baris hasil. Dua driver di bawah sama-sama memenuhi bentuk ini.
 */
export type Sql = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>;

let cached: Sql | null = null;

function readConnectionString(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

export function isDatabaseConfigured(): boolean {
  return readConnectionString() !== null;
}

function usesNeonHttp(connectionString: string): boolean {
  const driver = process.env.DB_DRIVER;
  if (driver === "neon") return true;
  if (driver === "pg") return false;

  try {
    return /(^|\.)neon\.(tech|build)$/.test(new URL(connectionString).hostname);
  } catch {
    return false;
  }
}

/** Driver Postgres biasa (Supabase, Railway, Postgres lokal, dsb). */
function createNodePostgresSql(connectionString: string): Sql {
  let poolPromise: Promise<{ query: (text: string, values: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }> | null =
    null;

  const getPool = () => {
    poolPromise ??= import("pg").then(({ Pool }) => new Pool({ connectionString }));
    return poolPromise;
  };

  return async (strings, ...values) => {
    // Rangkai jadi query berparameter ($1, $2, ...) — nilai tidak pernah
    // digabung langsung ke teks SQL.
    const text = strings.reduce(
      (acc, part, index) => acc + part + (index < values.length ? `$${index + 1}` : ""),
      "",
    );
    const pool = await getPool();
    const result = await pool.query(text, values);
    return result.rows;
  };
}

/**
 * Koneksi ke Postgres. Sengaja lazy supaya `next build` tetap jalan di mesin
 * yang belum punya DATABASE_URL.
 */
export function getSql(): Sql {
  if (cached) return cached;

  const connectionString = readConnectionString();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum diset. Hubungkan Neon lewat Vercel (Storage → Neon) atau isi DATABASE_URL di .env.local.",
    );
  }

  cached = usesNeonHttp(connectionString)
    ? (neon(connectionString) as Sql)
    : createNodePostgresSql(connectionString);

  return cached;
}

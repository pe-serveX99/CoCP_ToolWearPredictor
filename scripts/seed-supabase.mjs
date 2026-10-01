import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Read environment variables from .env.local if not already set
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31m[ERROR]\x1b[0m Supabase credentials missing! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY exist in .env.local.');
  process.exit(1);
}

console.log('\x1b[36m=====================================================\x1b[0m');
console.log('\x1b[36mCNC Tool Wear & Optimization Platform - Supabase Seeder\x1b[0m');
console.log('\x1b[36m=====================================================\x1b[0m');
console.log(`Connecting to: \x1b[33m${supabaseUrl}\x1b[0m\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTable(tableName, items, idField = 'id', chunkSize = 50) {
  console.log(`\x1b[34m[SEEDING]\x1b[0m ${tableName} (${items.length} records)...`);
  
  // Upsert in batches to avoid payload size constraints
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(tableName)
      .upsert(chunk, { onConflict: idField });

    if (error) {
      console.error(`\x1b[31m[FAILED]\x1b[0m Could not upsert into "${tableName}":`, error.message);
      if (error.code === '42P01' || error.message.includes('Could not find the table')) {
        console.error(`\x1b[33m[ACTION REQUIRED]\x1b[0m Table "${tableName}" does not exist in Supabase yet.`);
        console.error(`Please open your Supabase project SQL Editor at:\n  \x1b[36mhttps://supabase.com/dashboard/project/norumfnvgxfniofyxtoj/sql/new\x1b[0m`);
        console.error(`Paste and run the contents of:\n  \x1b[32msupabase/migrations/20261002000000_cnc_schema.sql\x1b[0m\n`);
      }
      return false;
    }
  }

  // Count verify
  const { count, error: countErr } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (!countErr && count !== null) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Seeded ${tableName}. Verified row count: \x1b[1m${count}\x1b[0m\n`);
  } else {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Seeded ${tableName} (${items.length} items upserted).\n`);
  }

  return true;
}

async function main() {
  try {
    // Dynamically load compiled mock dataset
    const mockModulePath = path.resolve(__dirname, 'generated/data/mock-cnc.js');
    if (!fs.existsSync(mockModulePath)) {
      console.error(`[ERROR] Compiled mock data not found at ${mockModulePath}. Please ensure TypeScript compilation completed.`);
      process.exit(1);
    }

    const {
      MOCK_MACHINES,
      MOCK_TOOLS,
      MOCK_MATERIALS,
      MOCK_ACTIVE_OPERATIONS,
    } = await import('./generated/data/mock-cnc.js');

    // 1. Seed Machines
    const okMachines = await seedTable('machines', MOCK_MACHINES);
    if (!okMachines) {
      console.log('\x1b[33m[ABORTED]\x1b[0m Seeding halted because prerequisite tables need creation in Supabase.');
      process.exitCode = 1;
      return;
    }

    // 2. Seed Tools
    const okTools = await seedTable('tools', MOCK_TOOLS, 'id', 50);
    if (!okTools) {
      process.exitCode = 1;
      return;
    }

    // 3. Seed Materials
    const okMaterials = await seedTable('materials', MOCK_MATERIALS);
    if (!okMaterials) {
      process.exitCode = 1;
      return;
    }

    // 4. Seed Active Operations
    const okOperations = await seedTable('active_operations', MOCK_ACTIVE_OPERATIONS);
    if (!okOperations) {
      process.exitCode = 1;
      return;
    }

    console.log('\x1b[32m=====================================================\x1b[0m');
    console.log('\x1b[32m[ALL DONE] Database successfully seeded with full CNC catalog!\x1b[0m');
    console.log('\x1b[32m=====================================================\x1b[0m');
  } catch (err) {
    console.error('\x1b[31m[UNEXPECTED ERROR]\x1b[0m', err);
    process.exitCode = 1;
  }
}

main();

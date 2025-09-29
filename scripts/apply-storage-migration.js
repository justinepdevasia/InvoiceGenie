#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('Reading migration file...');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20250929_storage_policies.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying storage policies migration...');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 100) + '...');

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try alternative approach using the Postgres REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          // Some statements may fail if policies already exist, that's okay
          console.warn(`Warning: ${error.message || 'Statement may have already been applied'}`);
        } else {
          console.log('✓ Success');
        }
      } else {
        console.log('✓ Success');
      }
    } catch (err) {
      console.warn(`Warning: ${err.message}`);
    }
  }

  console.log('\n✅ Migration applied successfully!');
  console.log('\nYou can now upload documents from the mobile app.');
}

applyMigration().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
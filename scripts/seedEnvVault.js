/**
 * Seed env vault entries (run once):
 *   node scripts/seedEnvVault.js
 *
 * Prefer using POST /api/env-vault/seed after OTP unlock from the admin UI.
 * This CLI script inserts missing keys only (does not overwrite existing values).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const EnvVault = require('../src/models/EnvVault');
const { ENV_VAULT_SEED } = require('../src/data/envVaultSeed');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const entry of ENV_VAULT_SEED) {
    const existing = await EnvVault.findOne({ scope: entry.scope, key: entry.key });
    if (existing) {
      skipped += 1;
      continue;
    }
    await EnvVault.create({
      scope: entry.scope,
      key: entry.key,
      value: entry.value ?? '',
      isSecret: entry.isSecret !== false,
    });
    created += 1;
    console.log(`  + ${entry.scope}.${entry.key}`);
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

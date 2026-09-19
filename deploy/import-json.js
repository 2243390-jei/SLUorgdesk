#!/usr/bin/env node
/**
 * Import mongoexport-format JSON into the OrgDesk collections.
 *
 * Run inside the api container, where mongoose and the MongoDB URI are available:
 *
 *   docker compose cp deploy/import-json.js api:/tmp/import-json.js
 *   docker compose cp <your-export-dir>     api:/tmp/export
 *   docker compose exec -T api node /tmp/import-json.js /tmp/export --dry-run
 *   docker compose exec -T api node /tmp/import-json.js /tmp/export
 *
 * Collections are matched from the file name, case-insensitively and ignoring a
 * trailing "s", so all of these land in the same place:
 *   User.json, users.json, Users.json              -> User
 *   Organizations.json, organization.json          -> Organizations
 *   Submissions.json, submission.json              -> Submissions
 *
 * Documents are inserted verbatim through the driver rather than through the
 * mongoose models, so field names, `_id` values and password hashes survive
 * unchanged. Mongoose would silently drop unknown fields, which would break the
 * PHP side of the application.
 *
 * Options:
 *   --drop               clear each target collection before inserting
 *   --dry-run            report what would happen, write nothing
 *   --no-hash-passwords  insert User passwords verbatim instead of hashing them
 *
 * Plaintext passwords in the User collection are hashed with bcrypt (cost 12)
 * before insertion, because PHP verifies with password_verify() and Node with
 * bcrypt.compare() - both reject plaintext. Existing bcrypt hashes are untouched.
 */

const fs = require('fs');
const path = require('path');

// Absolute paths: the container installs dependencies under /app/node-server.
const mongoose = require('/app/node-server/node_modules/mongoose');
const { EJSON } = require('/app/node-server/node_modules/bson');
const bcrypt = require('/app/node-server/node_modules/bcrypt');

// Matches an existing bcrypt hash ($2a$ / $2b$ / $2y$ plus the cost).
// Cost 12 is what node-server/controllers/usersControllers.js uses.
const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/;
const BCRYPT_COST = 12;

// Normalised key -> real collection name, as used by both the PHP and Node models.
const COLLECTIONS = {
  user: 'User',
  organization: 'Organizations',
  submission: 'Submissions',
};

function resolveCollection(fileName) {
  // mongoexport commonly names files "<database>.<collection>.json"
  // (e.g. Web-Tech.Organizations.json), so every dot-separated segment is tried
  // rather than only the whole base name.
  const base = path.basename(fileName).replace(/\.json$/i, '');
  const candidates = [base, ...base.split('.')];

  for (const candidate of candidates) {
    const key = candidate.toLowerCase().replace(/s$/, '');
    if (COLLECTIONS[key]) return COLLECTIONS[key];
  }
  return null;
}

/**
 * mongoexport writes either one document per line (default) or a single JSON
 * array (--jsonArray). Extended JSON ($oid, $date) is handled by EJSON.
 */
function readDocuments(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').trim();
  if (!text) return [];

  if (text.startsWith('[')) {
    const parsed = EJSON.parse(text, { relaxed: true });
    return Array.isArray(parsed) ? parsed : [];
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => EJSON.parse(line, { relaxed: true }));
}

async function main() {
  const args = process.argv.slice(2);
  const drop = args.includes('--drop');
  const dryRun = args.includes('--dry-run');
  const hashPasswords = !args.includes('--no-hash-passwords');
  const target = args.find((a) => !a.startsWith('--'));

  if (!target) {
    console.error('usage: node import-json.js <directory|file.json> [--drop] [--dry-run]');
    process.exit(2);
  }
  if (!fs.existsSync(target)) {
    console.error(`path not found: ${target}`);
    process.exit(2);
  }

  const files = fs.statSync(target).isDirectory()
    ? fs
        .readdirSync(target)
        .filter((f) => f.toLowerCase().endsWith('.json'))
        .map((f) => path.join(target, f))
    : [target];

  const plan = [];
  for (const file of files) {
    const collection = resolveCollection(file);
    if (!collection) {
      console.warn(`skipped  ${path.basename(file)}  (no matching collection)`);
      continue;
    }
    plan.push({ file, collection, docs: readDocuments(file) });
  }

  if (!plan.length) {
    console.error('nothing to import');
    process.exit(1);
  }

  console.log('plan:');
  for (const item of plan) {
    console.log(`  ${item.collection.padEnd(14)} <- ${path.basename(item.file)}  (${item.docs.length} documents)`);
  }

  if (dryRun) {
    console.log('\ndry run - no writes performed');
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log(`\nconnected to database: ${db.databaseName}`);

  for (const item of plan) {
    const collection = db.collection(item.collection);

    if (drop) {
      const cleared = await collection.deleteMany({});
      console.log(`  cleared  ${item.collection} (${cleared.deletedCount} documents)`);
    }
    if (!item.docs.length) continue;

    // User passwords in this export are plaintext, but the PHP backend verifies
    // with password_verify() and the Node backend with bcrypt.compare(); both
    // fail against plaintext, so plaintext values are hashed here using the same
    // cost the application uses. Values that are already bcrypt hashes are left
    // alone, which makes this safe to re-run.
    if (hashPasswords && item.collection === 'User') {
      let hashed = 0;
      for (const doc of item.docs) {
        if (typeof doc.password === 'string' && doc.password && !BCRYPT_PATTERN.test(doc.password)) {
          doc.password = await bcrypt.hash(doc.password, BCRYPT_COST);
          hashed += 1;
        }
      }
      if (hashed) {
        console.log(`  hashed ${hashed} plaintext password(s) with bcrypt cost ${BCRYPT_COST}`);
      }
    }

    // ordered:false so one duplicate _id does not abort the whole batch.
    try {
      const result = await collection.insertMany(item.docs, { ordered: false });
      console.log(`  inserted ${result.insertedCount} into ${item.collection}`);
    } catch (err) {
      const inserted = err.result?.nInserted ?? err.insertedCount ?? 0;
      const skipped = err.writeErrors?.length ?? 0;
      if (inserted || skipped) {
        console.log(`  inserted ${inserted} into ${item.collection}, skipped ${skipped} (duplicates)`);
      } else {
        throw err;
      }
    }
  }

  await mongoose.disconnect();
  console.log('\nimport complete');
}

main().catch((err) => {
  console.error('IMPORT FAILED:', err.message);
  process.exit(1);
});

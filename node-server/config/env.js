/**
 * Environment loading, imported before any other module reads process.env.
 *
 * Two files are consulted, in order of precedence:
 *   1. node-server/.env      - the Node-specific file that already existed
 *   2. <project-root>/.env    - shared with the PHP half of the application
 *
 * dotenv never overwrites a variable that is already set, so the first file wins
 * and, on Cloud Run, real environment variables (injected from Secret Manager)
 * win over both.
 *
 * This module must be imported before config/session.js and
 * middleware/internalAuth.js, which read process.env at load time.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 1. node-server/.env, resolved from the process working directory.
const localResult = dotenv.config();

// 2. Project root .env, shared with the PHP side of the application.
const rootEnvPath = path.join(__dirname, '..', '..', '.env');
const rootResult = fs.existsSync(rootEnvPath)
  ? dotenv.config({ path: rootEnvPath })
  : { parsed: null };

module.exports = {
  localEnvPath: localResult.parsed ? path.join(process.cwd(), '.env') : null,
  rootEnvPath: rootResult.parsed ? rootEnvPath : null,
};

// Verify the deployed Cloud Run services end to end.
// Passwords are read from the export and used, but never printed.
const fs = require('fs');

const BASE = process.argv[2];
if (!BASE) {
  console.error('usage: node verify-prod.js <web-url>');
  process.exit(2);
}

const users = JSON.parse(fs.readFileSync('data/Web-Tech.User.json', 'utf8'));

const post = (url, body, cookie) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });

const cookieOf = (res) => (res.headers.getSetCookie ? res.headers.getSetCookie() : [])
  .map((c) => c.split(';')[0])
  .join('; ');

(async () => {
  console.log('== public surface ==');
  for (const [label, path] of [
    ['login page      ', '/'],
    ['anonymous /api/users', '/api/users'],
    ['uploads guard   ', '/uploads/anything.pdf'],
  ]) {
    const r = await fetch(BASE + path, { redirect: 'manual' });
    console.log(`  ${label} -> ${r.status}${r.headers.get('location') ? ' (location: ' + r.headers.get('location') + ')' : ''}`);
  }

  console.log('\n== logins against the deployed stack ==');
  let ok = 0;
  for (const u of users) {
    const phpRes = await post(`${BASE}/php-server/routes/users.php`, {
      action: 'login', email: u.email, password: u.password,
    });
    const phpBody = await phpRes.json().catch(() => ({}));
    const nodeRes = await post(`${BASE}/api/users/login`, { email: u.email, password: u.password });
    const nodeBody = await nodeRes.json().catch(() => ({}));

    console.log(`  ${String(u.role).padEnd(14)} php=${phpBody.success ? 'OK  ' : 'FAIL'} (${phpRes.status})  node=${nodeBody.success ? 'OK  ' : 'FAIL'} (${nodeRes.status})`);
    if (!phpBody.success) console.log(`       php : ${phpBody.error}`);
    if (!nodeBody.success) console.log(`       node: ${nodeBody.error}`);
    if (phpBody.success && nodeBody.success) ok += 1;

    if (String(u.role).toLowerCase() === 'admin') {
      const cookie = cookieOf(nodeRes);
      for (const path of ['/api/users', '/api/organizations', '/api/stats']) {
        const r = await fetch(BASE + path, { headers: { Cookie: cookie } });
        console.log(`         authed ${path.padEnd(20)} -> ${r.status}`);
      }
    }
  }
  console.log(`\n  ${ok}/${users.length} users authenticated against the deployed services`);
})().catch((e) => {
  console.error('CHECK FAILED:', e.message);
  process.exit(1);
});

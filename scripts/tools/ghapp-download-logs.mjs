#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';

function b64u(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function makeJwt(appId, pem) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now - 60, exp: now + 9 * 60, iss: String(appId) };
  const enc = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(payload))}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(enc);
  const sig = sign.sign(pem);
  return `${enc}.${b64u(sig)}`;
}

function requestJson(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      method,
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'ghapp-client', ...headers },
    };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const ct = String(res.headers['content-type'] || '');
        let js = {};
        if (ct.startsWith('application/json')) {
          try {
            js = JSON.parse(buf.toString('utf8'));
          } catch {}
        }
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          json: js,
          body: buf,
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(
        Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))
      );
    }
    req.end();
  });
}

async function downloadToFile(url, headers, outPath, _redir = 0) {
  const u = new URL(url);
  const opts = {
    method: 'GET',
    hostname: u.hostname,
    path: u.pathname + u.search,
    headers: { 'User-Agent': 'ghapp-client', ...headers },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      // Follow redirects (S3 pre-signed URL)
      if (
        [301, 302, 303, 307, 308].includes(res.statusCode || 0) &&
        res.headers.location
      ) {
        if (_redir > 5)
          return resolve({
            ok: false,
            status: res.statusCode,
            body: 'Too many redirects',
          });
        const loc = res.headers.location;
        // For redirected S3 URL, drop auth headers
        downloadToFile(
          loc,
          { 'User-Agent': 'ghapp-client' },
          outPath,
          _redir + 1
        ).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ ok: false, status: res.statusCode, body });
        });
        return;
      }
      const ws = fs.createWriteStream(outPath);
      res.pipe(ws);
      ws.on('finish', () => resolve({ ok: true }));
      ws.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  function getArg(name, def) {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : def;
  }
  const appId = getArg('--app-id');
  const keyFile = getArg('--key-file');
  const owner = getArg('--owner');
  const repo = getArg('--repo');
  const runId = getArg('--run-id');
  const out = getArg('--out', `run-${runId}.zip`);

  if (!appId || !keyFile || !owner || !repo || !runId) {
    console.error(
      'Usage: --app-id <id> --key-file <pem> --owner <o> --repo <r> --run-id <id> [--out file]'
    );
    process.exit(2);
  }
  const pemPath = path.resolve(keyFile);
  if (!fs.existsSync(pemPath)) {
    console.error(`Private key not found: ${pemPath}`);
    process.exit(2);
  }
  const pem = fs.readFileSync(pemPath, 'utf8');
  const jwt = makeJwt(appId, pem);

  const base = 'https://api.github.com';
  const headersJwt = {
    Authorization: `Bearer ${jwt}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Resolve installation for repo
  const instResp = await requestJson(
    'GET',
    `${base}/repos/${owner}/${repo}/installation`,
    headersJwt
  );
  if (instResp.status !== 200) {
    console.error(
      'Failed to resolve installation:',
      instResp.status,
      instResp.json || instResp.body?.toString?.()
    );
    process.exit(3);
  }
  const instId = instResp.json.id;
  if (!instId) {
    console.error('No installation id in response');
    process.exit(3);
  }

  // Create installation token
  const tokResp = await requestJson(
    'POST',
    `${base}/app/installations/${instId}/access_tokens`,
    headersJwt,
    {}
  );
  if (tokResp.status !== 201) {
    console.error(
      'Failed to create installation token:',
      tokResp.status,
      tokResp.json || tokResp.body?.toString?.()
    );
    process.exit(4);
  }
  const instToken = tokResp.json.token;
  if (!instToken) {
    console.error('No token in access_tokens response');
    process.exit(4);
  }

  const headersInst = {
    Authorization: `Bearer ${instToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const url = `${base}/repos/${owner}/${repo}/actions/runs/${runId}/logs`;
  const dl = await downloadToFile(url, headersInst, out);
  if (!dl.ok) {
    console.error('Download failed:', dl.status, dl.body?.slice?.(0, 300));
    process.exit(5);
  }
  console.log(`Downloaded: ${out}`);
}

main().catch(err => {
  console.error('Unexpected error:', err?.message || err);
  process.exit(1);
});

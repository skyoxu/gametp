#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
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
    const opts = { method, hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'ghapp-client', ...headers } };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const ct = String(res.headers['content-type'] || '');
        let js = {};
        if (ct.startsWith('application/json')) { try { js = JSON.parse(buf.toString('utf8')); } catch {} }
        resolve({ status: res.statusCode || 0, headers: res.headers, json: js, body: buf });
      });
    });
    req.on('error', reject);
    if (body) req.write(Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)));
    req.end();
  });
}
async function downloadToFile(url, headers, outPath, _redir=0) {
  const u = new URL(url);
  const opts = { method: 'GET', hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'ghapp-client', ...headers } };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      if ([301,302,303,307,308].includes(res.statusCode || 0) && res.headers.location) {
        if (_redir > 5) return resolve({ ok: false, status: res.statusCode, body: 'Too many redirects' });
        downloadToFile(res.headers.location, { 'User-Agent': 'ghapp-client' }, outPath, _redir+1).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ ok: false, status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
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
async function main(){
  const args = process.argv.slice(2);
  function arg(n, d){ const i=args.indexOf(n); return i>=0? args[i+1]: d }
  const appId = arg('--app-id');
  const keyFile = arg('--key-file');
  const owner = arg('--owner');
  const repo = arg('--repo');
  const jobId = arg('--job-id');
  const out = arg('--out', `job-${jobId}.log`);
  if(!appId||!keyFile||!owner||!repo||!jobId){
    console.error('Usage: --app-id <id> --key-file <pem> --owner <o> --repo <r> --job-id <id> [--out file]');
    process.exit(2);
  }
  const pem = fs.readFileSync(path.resolve(keyFile),'utf8');
  const jwt = makeJwt(appId, pem);
  const base = 'https://api.github.com';
  const headersJwt = { Authorization: `Bearer ${jwt}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const inst = await requestJson('GET', `${base}/repos/${owner}/${repo}/installation`, headersJwt);
  if(inst.status!==200){ console.error('Installation lookup failed', inst.status, inst.json||inst.body?.toString?.()); process.exit(3); }
  const instId = inst.json.id;
  const tokenResp = await requestJson('POST', `${base}/app/installations/${instId}/access_tokens`, headersJwt, {});
  if(tokenResp.status!==201){ console.error('access_tokens failed', tokenResp.status, tokenResp.json||tokenResp.body?.toString?.()); process.exit(4); }
  const instToken = tokenResp.json.token;
  const headersInst = { Authorization: `Bearer ${instToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const url = `${base}/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`;
  const dl = await downloadToFile(url, headersInst, out);
  if(!dl.ok){ console.error('Download failed', dl.status, dl.body?.slice?.(0,300)); process.exit(5); }
  console.log(`Downloaded: ${out}`);
}
main().catch(e=>{ console.error('Unexpected', e?.message||e); process.exit(1); });


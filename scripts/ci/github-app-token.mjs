#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';

function logDir() {
  const d = new Date().toISOString().slice(0, 10);
  const dir = path.join('logs', d, 'gh-app');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function signJwtRS256(appId, pem) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = { iat: now - 60, exp: now + 9 * 60, iss: String(appId) };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(data);
  const sig = signer.sign(pem);
  return `${data}.${b64url(sig)}`;
}
function requestJson(method, url, headers = {}, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      method,
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'gh-app-utils', Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(headers || {}) },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(raw || '{}')) } catch { resolve({}) }
        } else { reject(new Error(`HTTP ${res.statusCode}: ${raw}`)) }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}
function args() { const a = process.argv.slice(2); const o={}; for(let i=0;i<a.length;i++){ const k=a[i]; o[k.replace(/^--/,'')] = a[i+1]; i++; } return o }
async function main(){
  const p=args();
  const appId=p['app-id']||process.env.GH_APP_ID; if(!appId) throw new Error('缺少 --app-id/GH_APP_ID');
  const keyFile=p['key-file']||process.env.GH_APP_PRIVATE_KEY_PATH||'gametp-ai-bot.2025-10-14.private-key.pem';
  if(!fs.existsSync(keyFile)) throw new Error('私钥不存在: '+keyFile);
  const pem=fs.readFileSync(keyFile,'utf8');
  const jwt=signJwtRS256(appId,pem);
  const dir=logDir();
  fs.writeFileSync(path.join(dir,'app-jwt.txt'),jwt,'utf8');
  if(p.owner&&p.repo){
    const inst=await requestJson('GET','https://api.github.com/app/installations',{Authorization:`Bearer ${jwt}`});
    const t = Array.isArray(inst)? inst.find(it=>it.account?.login?.toLowerCase()===(p.owner||'').toLowerCase())||inst[0]:null;
    if(!t) throw new Error('未找到安装');
    const tok=await requestJson('POST',`https://api.github.com/app/installations/${t.id}/access_tokens`,{Authorization:`Bearer ${jwt}`},{repositories:[p.repo]});
    fs.writeFileSync(path.join(dir,'access-token.json'),JSON.stringify({...tok,token:'REDACTED'},null,2));
    console.log((tok.token||'').slice(0,8));
  } else {
    console.log(jwt.slice(0,16));
  }
}
main().catch(e=>{ console.error('[ERR]',e.message); process.exit(1)});


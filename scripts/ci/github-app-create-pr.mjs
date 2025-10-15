#!/usr/bin/env node
import fs from 'node:fs';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

function b64url(buf){return Buffer.from(buf).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}
function signJwt(appId,pem){
  const now=Math.floor(Date.now()/1000);
  const h=b64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const p=b64url(JSON.stringify({iat:now-60,exp:now+9*60,iss:String(appId)}));
  const data=`${h}.${p}`;
  const crypto=await import('node:crypto');
  const signer=crypto.createSign('RSA-SHA256');
  signer.update(data); const sig=signer.sign(pem);
  return `${data}.${b64url(sig)}`;
}
function req(method,url,headers={},body){
  return new Promise((resolve,reject)=>{
    const u=new URL(url);
    const r=https.request({method,hostname:u.hostname,path:u.pathname+u.search,headers:{'User-Agent':'gh-app-pr-creator',Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...headers}},res=>{
      const chunks=[]; res.on('data',c=>chunks.push(c)); res.on('end',()=>{const raw=Buffer.concat(chunks).toString('utf8'); if(res.statusCode>=200&&res.statusCode<300){try{resolve(JSON.parse(raw||'{}'))}catch{resolve({})}} else {const e=new Error(raw); e.statusCode=res.statusCode; e.body=raw; reject(e)}});
    }); r.on('error',reject); if(body) r.write(typeof body==='string'?body:JSON.stringify(body)); r.end();
  })
}
function parse(){const a=process.argv.slice(2);const o={};for(let i=0;i<a.length;i++){const k=a[i]; o[k.replace(/^--/,'')]=a[i+1]; i++} return o}

const args=parse();
const appId=args['app-id']; const keyFile=args['key-file']; const owner=args.owner; const repo=args.repo; const base=args.base||'main'; const head=args.head; const title=args.title; const body=args.body||'';
if(!appId||!keyFile||!owner||!repo||!head||!title){ console.error('[ERR] missing args'); process.exit(1)}
const pem=fs.readFileSync(keyFile,'utf8');
const jwt=await signJwt(appId,pem);
const installs=await req('GET','https://api.github.com/app/installations',{Authorization:`Bearer ${jwt}`});
const inst=Array.isArray(installs)? installs.find(i=>i.account?.login?.toLowerCase()===owner.toLowerCase())||installs[0]:null;
if(!inst){ console.error('[ERR] no installation'); process.exit(1)}
const tok=await req('POST',`https://api.github.com/app/installations/${inst.id}/access_tokens`,{Authorization:`Bearer ${jwt}`},{repositories:[repo],permissions:{pull_requests:'write',contents:'write'}});
const token=tok.token;
try{
  const pr=await req('POST',`https://api.github.com/repos/${owner}/${repo}/pulls`,{Authorization:`Bearer ${token}`},{title,head,base,body});
  console.log(`[OK] PR #${pr.number} ${pr.html_url}`);
}catch(e){ if(e.statusCode===422 && /already exists/i.test(e.body||'')){ const list=await req('GET',`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&head=${owner}:${head}`,{Authorization:`Bearer ${token}`}); if(Array.isArray(list)&&list.length){ console.log(`[OK] existing PR #${list[0].number} ${list[0].html_url}`); process.exit(0)} } throw e }


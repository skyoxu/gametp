#!/usr/bin/env node
import fs from 'node:fs';
import https from 'node:https';
import crypto from 'node:crypto';

function b64url(buf){return Buffer.from(buf).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}
function signJwt(appId,pem){
  const now=Math.floor(Date.now()/1000);
  const h=b64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const p=b64url(JSON.stringify({iat:now-60,exp:now+9*60,iss:String(appId)}));
  const data=`${h}.${p}`;
  const signer=crypto.createSign('RSA-SHA256'); signer.update(data);
  const sig=signer.sign(pem); return `${data}.${b64url(sig)}`;
}
function req(method,url,headers={},body){
  return new Promise((resolve,reject)=>{
    const u=new URL(url);
    const r=https.request({method,hostname:u.hostname,path:u.pathname+u.search,headers:{'User-Agent':'gh-app-pr-admin',Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...headers}},res=>{
      const chunks=[]; res.on('data',c=>chunks.push(c)); res.on('end',()=>{const raw=Buffer.concat(chunks).toString('utf8'); if(res.statusCode>=200&&res.statusCode<300){try{resolve(JSON.parse(raw||'{}'))}catch{resolve({})}} else {const e=new Error(raw); e.statusCode=res.statusCode; e.body=raw; reject(e)}});
    }); r.on('error',reject); if(body) r.write(typeof body==='string'?body:JSON.stringify(body)); r.end();
  })
}
function parse(){const a=process.argv.slice(2); const o={}; for(let i=0;i<a.length;i++){ const k=a[i]; if(k.startsWith('--')) { const key=k.replace(/^--/,''); if(i+1<a.length && !a[i+1].startsWith('--')) { o[key]=a[i+1]; i++; } else { o[key]=true } } } return o }

const p=parse();
const appId=p['app-id']; const keyFile=p['key-file']; const owner=p.owner; const repo=p.repo;
if(!appId||!keyFile||!owner||!repo){ console.error('[ERR] missing args'); process.exit(1)}
const pem=fs.readFileSync(keyFile,'utf8'); const jwt=signJwt(appId,pem);
const inst=await req('GET','https://api.github.com/app/installations',{Authorization:`Bearer ${jwt}`});
const i = Array.isArray(inst)? inst.find(x=>x.account?.login?.toLowerCase()===owner.toLowerCase())||inst[0]:null;
if(!i){ console.error('[ERR] no installation'); process.exit(1)}
const tok=await req('POST',`https://api.github.com/app/installations/${i.id}/access_tokens`,{Authorization:`Bearer ${jwt}`},{repositories:[repo],permissions:{pull_requests:'write',contents:'write'}});
const token=tok.token;

if(p.close){
  const num=Number(p.close);
  const pr=await req('PATCH',`https://api.github.com/repos/${owner}/${repo}/pulls/${num}`,{Authorization:`Bearer ${token}`},{state:'closed'});
  console.log(`[OK] closed PR #${num}`)
}
if(p['delete-branch']){
  const br=p['delete-branch'];
  try{
    await req('DELETE',`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(br)}`,{Authorization:`Bearer ${token}`});
    console.log(`[OK] deleted branch ${br}`)
  }catch(e){ console.error('[WARN] delete branch failed', e.statusCode||'', e.body||'') }
}

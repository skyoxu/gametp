#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function stripBOMFile(p) {
  const buf = fs.readFileSync(p);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    fs.writeFileSync(p, buf.slice(3));
    console.log(`Stripped BOM: ${p}`);
  }
}

['package.json'].forEach(f => {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) stripBOMFile(p);
});

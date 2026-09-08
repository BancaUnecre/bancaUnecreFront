const fs = require('fs');
const path = 'src/types/index.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "saldo: number;",
  "saldo: number;\n  saldo_retenido: number;"
);

fs.writeFileSync(path, content);
console.log("Types patched");

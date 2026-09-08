const fs = require('fs');
const file = './src/types/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "cuenta_id: number;\n  limite_credito: number;",
  "cuenta_id: number;\n  limite_credito: number;\n  tipo_vinculo?: string;"
);
// Also for TerminalTarjeta
content = content.replace(
  "estado: 'activa' | 'inactiva' | 'bloqueada';\n}",
  "estado: 'activa' | 'inactiva' | 'bloqueada';\n  nombre_titular?: string;\n}"
);

fs.writeFileSync(file, content, 'utf8');

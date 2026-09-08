const fs = require('fs');
const path = 'c:/discos/proyectos/banco/bancaUnecreFront/src/components/Layout/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add icons import
content = content.replace(
  "Activity,",
  "Activity, ArrowDownCircle, ArrowUpCircle,"
);

// Add items to operacionesItems array
content = content.replace(
  "{ to: '/operaciones/vales/autorizar', label: 'Autorizar Vales',       icon: ShieldCheck },",
  "{ to: '/operaciones/vales/autorizar', label: 'Autorizar Vales',       icon: ShieldCheck },\n  { to: '/operaciones/deposito', label: 'Depositar a cuenta', icon: ArrowDownCircle },\n  { to: '/operaciones/retiro', label: 'Retirar de cuenta', icon: ArrowUpCircle },"
);

fs.writeFileSync(path, content);
console.log("Sidebar.tsx updated");

const fs = require('fs');
const file = './src/pages/operaciones/AbonosCredito.tsx';
let content = fs.readFileSync(file, 'utf8');

// We need to modify the table columns to show Capital and Interest separately
const tableRender = `
        {
          key: 'importe',
          header: 'Monto Original',
          render: r => <span className="font-medium text-gray-700">{fmtMoney(Number(r.importe))}</span>,
        },
        {
          key: 'saldo_pendiente',
          header: 'Capital Restante',
          render: r => <span className="font-semibold text-gray-900">{fmtMoney(Number(r.saldo_pendiente))}</span>,
        },
        {
          key: 'intereses_devengados_hoy',
          header: 'Interés Acumulado',
          render: r => <span className="font-semibold text-red-600">{fmtMoney(Number(r.intereses_devengados_hoy || 0))}</span>,
        },
        {
          key: 'deuda_total_hoy',
          header: 'Deuda Total',
          render: r => <span className="font-bold text-gray-900">{fmtMoney(Number(r.deuda_total_hoy || r.saldo_pendiente))}</span>,
        },
`;

content = content.replace(
  /\{\s*key: 'importe'[\s\S]*?key: 'saldo_pendiente'[\s\S]*?\},/m,
  tableRender
);

content = content.replace(
  /const importeAbono = parseFloat\(montoAbono\);\s*if \(importeAbono > c.saldo_pendiente\)/m,
  "const importeAbono = parseFloat(montoAbono);\n            if (importeAbono > (c.deuda_total_hoy || c.saldo_pendiente))"
);

fs.writeFileSync(file, content, 'utf8');

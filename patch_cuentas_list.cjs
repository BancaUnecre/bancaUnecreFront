const fs = require('fs');
const path = 'src/pages/cuentas/CuentasList.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
    {
      key: 'saldos',
      header: 'Saldos',
      render: r => {
        const retenido = Number(r.saldo_retenido) || 0;
        const disponible = r.saldo - retenido;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 mr-2">Total:</span>
              <span className={\`font-bold \${r.saldo >= 0 ? 'text-emerald-700' : 'text-red-600'}\`}>
                {fmtMoney(r.saldo, r.moneda)}
              </span>
            </div>
            {retenido > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 mr-2">Retenido:</span>
                <span className="text-orange-600 font-medium">
                  -{fmtMoney(retenido, r.moneda)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-0.5 mt-0.5">
              <span className="text-gray-600 font-medium mr-2">Dispon:</span>
              <span className={\`font-bold \${disponible >= 0 ? 'text-primary-700' : 'text-red-600'}\`}>
                {fmtMoney(disponible, r.moneda)}
              </span>
            </div>
          </div>
        );
      },
    },`;

// Replace the old saldo column
content = content.replace(/\{\s*key:\s*'saldo',\s*header:\s*'Saldo'[\s\S]*?\},/, replacement);

fs.writeFileSync(path, content);
console.log("CuentasList patched");

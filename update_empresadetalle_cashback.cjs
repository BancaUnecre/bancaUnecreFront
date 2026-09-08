const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const cashbackHTML = `
                    {/* Premio por Pronto Pago */}
                    <div className="col-span-2 border border-gray-200 rounded-lg p-4 bg-emerald-50 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-emerald-800">Premio por Pronto Pago (Cashback)</h3>
                          <p className="text-sm text-emerald-600 mt-1">Porcentaje de la compra que se regresará a la cuenta de ahorros del cliente si liquida su crédito antes o durante la fecha de vencimiento.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-emerald-200 shadow-sm">
                          <span className="text-sm font-medium text-gray-700">Porcentaje (%):</span>
                          <input type="number" step="0.01" {...register('cashback_porcentaje')} className="input-field w-24 text-right font-bold text-emerald-700" placeholder="Ej. 0.5" />
                        </div>
                      </div>
                    </div>
`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<div className="col-span-2 flex items-center gap-3 mt-4">/m,
  '</div>\n                    </div>\n' + cashbackHTML + '\n                    <div className="col-span-2 flex items-center gap-3 mt-4">'
);

fs.writeFileSync(file, content, 'utf8');

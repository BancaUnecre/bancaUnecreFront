const fs = require('fs');
const path = 'src/pages/operaciones/EstadoCuenta.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldHeader = `<div className="text-right">
                    <p className="text-primary-300 text-xs">Saldo Actual</p>
                    <p className="text-3xl font-bold text-white">{fmtMoney(cuenta.saldo)}</p>
                    <p className="text-primary-300 text-xs mt-1">{cuenta.tipo_cuenta}  {cuenta.moneda}</p>
                  </div>`;

const newHeader = `<div className="text-right flex flex-col items-end">
                    <div className="flex gap-6 mb-2">
                      <div className="text-right">
                        <p className="text-primary-300 text-[11px] uppercase tracking-wider">Retenido</p>
                        <p className="text-lg font-medium text-orange-200">{fmtMoney(Number(cuenta.saldo_retenido) || 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary-300 text-[11px] uppercase tracking-wider">Saldo Total</p>
                        <p className="text-lg font-medium text-white">{fmtMoney(cuenta.saldo)}</p>
                      </div>
                    </div>
                    <div className="text-right border-t border-primary-500/50 pt-2 mt-1 min-w-[180px]">
                      <p className="text-primary-200 text-xs font-medium">Saldo Disponible</p>
                      <p className="text-3xl font-bold text-white">{fmtMoney(cuenta.saldo - (Number(cuenta.saldo_retenido) || 0))}</p>
                    </div>
                    <p className="text-primary-300 text-xs mt-2">{cuenta.tipo_cuenta} • {cuenta.moneda}</p>
                  </div>`;

content = content.replace(oldHeader, newHeader);

const oldStats = `{ label: 'Saldo Actual',  value: fmtMoney(cuenta.saldo),       icon: CreditCard,   color: 'text-gray-700' },`;
const newStats = `{ label: 'Saldo Disp.',  value: fmtMoney(cuenta.saldo - (Number(cuenta.saldo_retenido) || 0)),       icon: CreditCard,   color: 'text-gray-700' },`;
content = content.replace(oldStats, newStats);

fs.writeFileSync(path, content);
console.log("EstadoCuenta patched");

const fs = require('fs');
let code = fs.readFileSync('src/pages/cuentas/AperturaCuenta.tsx', 'utf8');

code = code.replace(/limite_credito: number;/, "limite_credito: number;\n  tasa_credito: number;");

code = code.replace(/setConfig\(\{\s*tipo_cuenta: '', moneda: 'MXN', nivel_cuenta_id: 1, saldo: 0, limite_credito: 0,\s*\}\);/, "setConfig({ tipo_cuenta: '', moneda: 'MXN', nivel_cuenta_id: 1, saldo: 0, limite_credito: 0, tasa_credito: 0 });");

code = code.replace(/setConfig\(\{\s*tipo_cuenta: '', moneda: 'MXN', nivel_cuenta_id: 1, saldo: 0, limite_credito: 0\s*\}\);/, "setConfig({ tipo_cuenta: '', moneda: 'MXN', nivel_cuenta_id: 1, saldo: 0, limite_credito: 0, tasa_credito: 0 });");

code = code.replace(/limite_credito: config.limite_credito,/, "limite_credito: config.limite_credito,\n        tasa_credito: config.tasa_credito,");

let limiteInput = \
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={config.limite_credito}
                          onChange={e => setConfig(c => ({ ...c, limite_credito: Number(e.target.value) }))}
                          className="input-field pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
\;

let tasaInput = limiteInput + \
                    <div>
                      <label className="label-field text-sm font-medium">Tasa de Crédito (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={config.tasa_credito}
                          onChange={e => setConfig(c => ({ ...c, tasa_credito: Number(e.target.value) }))}
                          className="input-field pr-7"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                    </div>
\;

code = code.replace(limiteInput, tasaInput);

fs.writeFileSync('src/pages/cuentas/AperturaCuenta.tsx', code);

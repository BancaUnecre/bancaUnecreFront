const fs = require('fs');
let code = fs.readFileSync('src/pages/cuentas/AperturaCuenta.tsx', 'utf8');

code = code.replace(/limite_credito: 0,/, "limite_credito: 0, tasa_credito: 0,");
code = code.replace(/limite_credito: 0 \}/, "limite_credito: 0, tasa_credito: 0 }");

let uiInjection = \
                  {(config.tipo_cuenta === 'CHEQUES' || config.tipo_cuenta === 'INVERSION') && (
                    <>
                    <div>
                      <label className="label-field">Límite de Crédito</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
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
                    <div>
                      <label className="label-field">Tasa de Crédito (%)</label>
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
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                      </div>
                    </div>
                    </>
                  )}
\;

code = code.replace(/\{\(config.tipo_cuenta === 'CHEQUES' \|\| config.tipo_cuenta === 'INVERSION'\) && \([\s\S]*?<\/div>\s*\}\)/, uiInjection);

code = code.replace(/tasa_credito:\s*config\.tasa_credito\s*,?\s*/, "");
code = code.replace(/limite_credito: config.limite_credito,/, "limite_credito: config.limite_credito,\n          tasa_credito: config.tasa_credito,");

fs.writeFileSync('src/pages/cuentas/AperturaCuenta.tsx', code);

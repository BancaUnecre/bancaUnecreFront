const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const opcionesDeCobro = `
                  <div className="col-span-2 border border-gray-200 rounded-lg p-4 bg-white mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Opciones de Cobro a Crédito</h3>
                    <div className="flex flex-col gap-4">
                      
                      {/* 15 Dias */}
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" id="dias_credito_15" {...register('dias_credito_15')} className="w-4 h-4 rounded accent-primary-700" />
                          <label htmlFor="dias_credito_15" className="text-sm font-medium text-gray-700">Permitir Crédito a 15 Días</label>
                        </div>
                        {watch('dias_credito_15') && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Tasa de interés (%):</span>
                            <input type="number" step="0.01" {...register('tasa_15')} className="input-field w-24 text-sm" placeholder="Ej. 5" />
                          </div>
                        )}
                      </div>

                      {/* 30 Dias */}
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" id="dias_credito_30" {...register('dias_credito_30')} className="w-4 h-4 rounded accent-primary-700" />
                          <label htmlFor="dias_credito_30" className="text-sm font-medium text-gray-700">Permitir Crédito a 30 Días</label>
                        </div>
                        {watch('dias_credito_30') && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Tasa de interés (%):</span>
                            <input type="number" step="0.01" {...register('tasa_30')} className="input-field w-24 text-sm" placeholder="Ej. 5" />
                          </div>
                        )}
                      </div>

                      {/* 60 Dias (I add this as standard) */}
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" id="dias_credito_60" {...register('dias_credito_60')} className="w-4 h-4 rounded accent-primary-700" />
                          <label htmlFor="dias_credito_60" className="text-sm font-medium text-gray-700">Permitir Crédito a 60 Días</label>
                        </div>
                        {watch('dias_credito_60') && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Tasa de interés (%):</span>
                            <input type="number" step="0.01" {...register('tasa_60')} className="input-field w-24 text-sm" placeholder="Ej. 5" />
                          </div>
                        )}
                      </div>

                      {/* 90 Dias (I add this as standard) */}
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" id="dias_credito_90" {...register('dias_credito_90')} className="w-4 h-4 rounded accent-primary-700" />
                          <label htmlFor="dias_credito_90" className="text-sm font-medium text-gray-700">Permitir Crédito a 90 Días</label>
                        </div>
                        {watch('dias_credito_90') && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Tasa de interés (%):</span>
                            <input type="number" step="0.01" {...register('tasa_90')} className="input-field w-24 text-sm" placeholder="Ej. 5" />
                          </div>
                        )}
                      </div>

                      {/* Custom Dias */}
                      <div className="flex flex-col gap-2 bg-gray-50 p-2 rounded border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" id="dias_credito_custom" {...register('dias_credito_custom')} className="w-4 h-4 rounded accent-primary-700" />
                            <label htmlFor="dias_credito_custom" className="text-sm font-medium text-gray-700">Permitir Días Personalizados</label>
                          </div>
                          {watch('dias_credito_custom') && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">Tasa de interés (%):</span>
                              <input type="number" step="0.01" {...register('tasa_custom')} className="input-field w-24 text-sm" placeholder="Ej. 5" />
                            </div>
                          )}
                        </div>
                        
                        {watch('dias_credito_custom') && (
                          <div className="pl-7 flex flex-col gap-1">
                            <label className="text-xs text-gray-500 font-medium">Días Máximos Permitidos (Máximo 365 días)</label>
                            <input type="number" max={365} {...register('max_dias_custom')} className="input-field w-48 text-sm" placeholder="Ej. 180" />
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
`;

content = content.replace(
  /<\/div>\s*<div className="flex items-center gap-3 mt-4">/m,
  opcionesDeCobro + '\n                  </div>\n                  <div className="flex items-center gap-3 mt-4">'
);

fs.writeFileSync(file, content, 'utf8');

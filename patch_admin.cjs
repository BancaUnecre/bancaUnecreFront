const fs = require('fs');
let code = fs.readFileSync('src/pages/empresas/EmpresaDetalle.tsx', 'utf8');

let creditInjection = \
                {/* Configuracion de Credito */}
                <div className="col-span-2 border border-gray-200 rounded-lg p-4 bg-white mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Opciones de Cobro a Crédito</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="dias_credito_15" {...register('dias_credito_15')} className="w-4 h-4 rounded accent-primary-700" />
                      <label htmlFor="dias_credito_15" className="text-sm font-medium text-gray-700">Permitir Crédito a 15 Días</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="dias_credito_30" {...register('dias_credito_30')} className="w-4 h-4 rounded accent-primary-700" />
                      <label htmlFor="dias_credito_30" className="text-sm font-medium text-gray-700">Permitir Crédito a 30 Días</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="dias_credito_custom" {...register('dias_credito_custom')} className="w-4 h-4 rounded accent-primary-700" />
                      <label htmlFor="dias_credito_custom" className="text-sm font-medium text-gray-700">Permitir Días Personalizados</label>
                    </div>
                    
                    <div className="mt-2 pl-7 flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-600">Días Máximos Permitidos (Aplica si se habilita 'Días Personalizados', Máximo 365 días)</label>
                      <input type="number" {...register('max_dias_custom', { max: { value: 365, message: 'El máximo absoluto es 365 días' }, min: 1 })} className="input-field w-48" placeholder="Ej. 180" />
                      {errors.max_dias_custom && <p className="text-red-500 text-xs mt-1">{errors.max_dias_custom.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
\;

code = code.replace(/<div className="flex items-center gap-3">[\s\S]*?<input type="checkbox" id="activo"/, creditInjection + '  <input type="checkbox" id="activo"');

fs.writeFileSync('src/pages/empresas/EmpresaDetalle.tsx', code);

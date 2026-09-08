const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const plazos = ['15', '30', '60', '90', 'custom'];
for (const p of plazos) {
  content = content.replace(
    new RegExp(`\\{watch\\('dias_credito_${p}'\\) && \\([\\s\\S]*?<span className="text-xs font-medium text-gray-500">Tasa de interés \\(%\\):<\\/span>[\\s\\S]*?<input type="number" step="0.01" \\{...register\\('tasa_${p}'\\)} className="input-field w-24 text-sm" placeholder="Ej\\. 5" \\/>[\\s\\S]*?<\\/div>[\\s\\S]*?\\)\\}`),
    `{watch('dias_credito_${p}') && (
                            <div className="flex flex-col gap-2 bg-white p-2 rounded border border-gray-200">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-medium text-gray-600">Interés al Cliente (%):</span>
                                <input type="number" step="0.01" {...register('tasa_cliente_${p}')} className="input-field w-20 text-sm py-1" placeholder="Ej. 5" />
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-medium text-gray-600">Comisión Empresa (%):</span>
                                <input type="number" step="0.01" {...register('tasa_empresa_${p}')} className="input-field w-20 text-sm py-1" placeholder="Ej. 2" />
                              </div>
                            </div>
                          )}`
  );
}

fs.writeFileSync(file, content, 'utf8');

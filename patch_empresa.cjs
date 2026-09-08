const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const replaceRegex = (regex, replacement) => {
    content = content.replace(regex, replacement);
};

// 1. Tasas Split
const plazos = ['15', '30', '60', '90', 'custom'];
for (const p of plazos) {
  replaceRegex(
    new RegExp(`\\{watch\\('dias_credito_${p}'\\) && \\([\\s\\S]*?<span className="text-xs font-medium text-gray-500">Tasa de interés \\(%\\):<\\/span>[\\s\\S]*?<input type="number" step="0.01" \\{...register\\('tasa_${p}'\\)} className="input-field w-24 text-sm" placeholder="Ej\\. 5" \\/>[\\s\\S]*?<\\/div>[\\s\\S]*?\\)\\}`),
    `{watch('dias_credito_${p}') && (
                            <div className="flex flex-col gap-2 bg-white p-2 rounded border border-gray-200">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-medium text-gray-600">Interés al Cliente (%):</span>
                                <input type="number" min="0" step="0.01" {...register('tasa_cliente_${p}')} className="input-field w-20 text-sm py-1" placeholder="Ej. 5" />
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-medium text-gray-600">Comisión Empresa (%):</span>
                                <input type="number" min="0" step="0.01" {...register('tasa_empresa_${p}')} className="input-field w-20 text-sm py-1" placeholder="Ej. 2" />
                              </div>
                            </div>
                          )}`
  );
}

// 2. Cashback block before "Empresa activa"
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
                          <input type="number" min="0" step="0.01" {...register('cashback_porcentaje')} className="input-field w-24 text-right font-bold text-emerald-700" placeholder="Ej. 0.5" />
                        </div>
                      </div>
                    </div>
`;
replaceRegex(
  /\<div className="col-span-2 flex items-center gap-3 mt-4"\>/,
  cashbackHTML + '\n                    <div className="col-span-2 flex items-center gap-3 mt-4">'
);

// 3. Vincular Form Types & State
replaceRegex(/limite_credito: number;\s*\}/, "limite_credito: number;\n  tipo_vinculo: string;\n}");
content = content.replace(/\{ cliente_id: 0, cuenta_id: 0, limite_credito: 0 \}/g, "{ cliente_id: 0, cuenta_id: 0, limite_credito: 0, tipo_vinculo: 'CLIENTE_COMERCIAL' }");
replaceRegex(
  /limite_credito: vincForm\.limite_credito,\s*total_debito: 0,/,
  "limite_credito: vincForm.limite_credito,\n          tipo_vinculo: vincForm.tipo_vinculo,\n          total_debito: 0,"
);

// 4. Tipo de Vinculo Column
const newCol = `
      {
        key: 'tipo_vinculo',
        header: 'Tipo de Vínculo',
        render: r => (
          <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${r.tipo_vinculo === 'EMPLEADO_NOMINA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}\`}>
            {r.tipo_vinculo === 'EMPLEADO_NOMINA' ? 'Empleado (Nómina)' : 'Cliente (Tienda)'}
          </span>
        )
      },
`;
replaceRegex(
  /const vincColumns: Column\<EmpresaCliente\>\[\] = \[\s*\{/,
  "const vincColumns: Column<EmpresaCliente>[] = [\n" + newCol + "      {"
);

// 5. Tipo de Vinculo Selector in Modal (Search for Límite de Crédito exact match)
const selectHTML = `
            <div>
              <label className="label-field">Tipo de Vínculo</label>
              <select
                value={vincForm.tipo_vinculo}
                onChange={e => setVincForm({ ...vincForm, tipo_vinculo: e.target.value })}
                className="input-field mb-4"
              >
                <option value="CLIENTE_COMERCIAL">Cliente de Tienda (Tarjeta Departamental)</option>
                <option value="EMPLEADO_NOMINA">Empleado (Crédito de Nómina)</option>
              </select>
            </div>
`;
const lines = content.split('\n');
const out = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('className="label-field">L') && lines[i].includes('Cr')) {
        if (!content.includes('Tipo de Vínculo')) out.push(selectHTML);
    }
    out.push(lines[i]);
}
content = out.join('\n');

// 6. Reporte Nomina Button and Fetch
replaceRegex(
  /import \{\s*Trash2, Link2, CheckCircle2, XCircle, Search, Loader2, AlertCircle,\s*\} from 'lucide-react';/,
  "import { Trash2, Link2, CheckCircle2, XCircle, Search, Loader2, AlertCircle, Download } from 'lucide-react';"
);

const fetchLogic = `
    const descargarNomina = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(\`https://bancaunecre.com/api/empresas/\${empresaId}/reporte-nomina\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`nomina_empresa_\${empresaId}.csv\`;
        a.click();
      } catch(e) { alert("Error descargando reporte"); }
    };
`;
replaceRegex(/const handleDesvincular = async \(\) => \{/, fetchLogic + "\n    const handleDesvincular = async () => {");

const btnHTML = `
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Clientes y Cuentas Vinculadas</h3>
                <div className="flex gap-2">
                  <button onClick={descargarNomina} className="btn-secondary text-sm">
                    <Download size={15} className="mr-1 inline" /> Reporte Nómina
                  </button>
                  <button onClick={openVincular} className="btn-primary">
                    <Plus size={15} />Vincular Cliente
                  </button>
                </div>
              </div>
`;
replaceRegex(
  /\<div className="flex items-center justify-between"\>[\s\S]*?\<\/button\>\s*\<\/div\>/,
  btnHTML
);

fs.writeFileSync(file, content, 'utf8');

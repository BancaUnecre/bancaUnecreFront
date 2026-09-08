const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Split tasas
const plazos = ['15', '30', '60', '90', 'custom'];
for (const p of plazos) {
  content = content.replace(
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

// 2. Add cashback
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
const lines = content.split('\n');
const out = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('className="col-span-2 flex items-center gap-3 mt-4"')) {
        if (!content.includes('Premio por Pronto Pago')) out.push(cashbackHTML);
    }
    out.push(lines[i]);
}
content = out.join('\n');

// 3. Update Vincular Form
content = content.replace(
  "limite_credito: number;\n}",
  "limite_credito: number;\n  tipo_vinculo: string;\n}"
);
content = content.replace(/\{ cliente_id: 0, cuenta_id: 0, limite_credito: 0 \}/g, "{ cliente_id: 0, cuenta_id: 0, limite_credito: 0, tipo_vinculo: 'CLIENTE_COMERCIAL' }");
content = content.replace(
  "limite_credito: vincForm.limite_credito,\n          total_debito: 0,",
  "limite_credito: vincForm.limite_credito,\n          tipo_vinculo: vincForm.tipo_vinculo,\n          total_debito: 0,"
);
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
content = content.replace(
  /const vincColumns: Column<EmpresaCliente>\[\] = \[\s*\{/m,
  "const vincColumns: Column<EmpresaCliente>[] = [\n" + newCol + "      {"
);
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
const lines2 = content.split('\n');
const out2 = [];
for (let i = 0; i < lines2.length; i++) {
    if (lines2[i].includes('className="label-field">L') && lines2[i].includes('Cr')) {
        if (!content.includes('Tipo de Vínculo')) out2.push(selectHTML);
    }
    out2.push(lines2[i]);
}
content = out2.join('\n');

// 4. Reporte Nomina
content = content.replace("Trash2, Link2, CheckCircle2, XCircle, Search, Loader2, AlertCircle,", "Trash2, Link2, CheckCircle2, XCircle, Search, Loader2, AlertCircle, Download,");
const fetchLogic = `
    const descargarNomina = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(\`http://localhost:3000/api/empresas/\${empresaId}/reporte-nomina\`, {
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
content = content.replace("const handleDesvincular", fetchLogic + "\n    const handleDesvincular");
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
content = content.replace(
  /\<div className="flex items-center justify-between"\>\s*\<h3 className="font-semibold text-gray-800"\>Clientes y Cuentas Vinculadas\<\/h3\>\s*\<button onClick=\{openVincular\} className="btn-primary"\>\s*\<Plus size=\{15\} \/\>Vincular Cliente\s*\<\/button\>\s*\<\/div\>/m,
  btnHTML
);

fs.writeFileSync(file, content, 'utf8');

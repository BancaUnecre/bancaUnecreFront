const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const btnHTML = `
                <div className="flex gap-2">
                  <button onClick={() => window.open(\`https://bancaunecre.com/api/empresas/\${empresaId}/reporte-nomina\`, '_blank')} className="btn-secondary text-sm">
                    Descargar Reporte Nómina (CSV)
                  </button>
                  <button onClick={openVincular} className="btn-primary">
                    <Plus size={15} />Vincular Cliente
                  </button>
                </div>
`;

content = content.replace(
  /\<button onClick=\{openVincular\} className="btn-primary"\>\s*\<Plus size=\{15\} \/\>Vincular Cliente\s*\<\/button\>/m,
  btnHTML
);

fs.writeFileSync(file, content, 'utf8');

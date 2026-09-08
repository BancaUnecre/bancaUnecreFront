const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexCol = /\<span className=\{\`inline-flex items-center px-2 py-0\.5 rounded text-xs font-medium \$\{r\.tipo_vinculo === 'EMPLEADO_NOMINA' \? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'\}\`\}\>[\s\S]*?\<\/span\>/m;

const newHTML = `
            <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${
              r.tipo_vinculo === 'EMPLEADO_NOMINA' ? 'bg-blue-100 text-blue-800' : 
              r.tipo_vinculo === 'EMPLEADO_VIATICOS' ? 'bg-amber-100 text-amber-800' : 
              'bg-purple-100 text-purple-800'
            }\`}>
              {r.tipo_vinculo === 'EMPLEADO_NOMINA' ? '💼 Nómina (B2B)' : 
               r.tipo_vinculo === 'EMPLEADO_VIATICOS' ? '🏢 Viáticos (B2B)' : 
               '💳 Comercial (B2C)'}
            </span>
`;

content = content.replace(regexCol, newHTML.trim());
fs.writeFileSync(file, content, 'utf8');

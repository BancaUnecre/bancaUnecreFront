const fs = require('fs');
let code = fs.readFileSync('src/pages/clientes/ClienteForm.tsx', 'utf8');

if (!code.includes('useAuth')) {
    code = code.replace("import { clientesService }", "import { useAuth } from '../../context/AuthContext';\nimport { clientesService }");
}

if (!code.includes('const { user } = useAuth();')) {
    code = code.replace("const navigate = useNavigate();", "const navigate = useNavigate();\n  const { user } = useAuth();\n  const isAdmin = user?.rol === 'ADMINISTRADOR' || user?.rol === 'ADMIN' || user?.rol === 'GERENTE';");
}

code = code.replace("{isEdit && (", "{isEdit && isAdmin && (");

fs.writeFileSync('src/pages/clientes/ClienteForm.tsx', code, 'utf8');

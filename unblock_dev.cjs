const fs = require('fs');

// 1. Unblock Sidebar
let sidebar = fs.readFileSync('src/components/Layout/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  "const isAdmin = user?.rol === 'ADMINISTRADOR' || user?.rol === 'ADMIN' || user?.rol === 'GERENTE';", 
  "const isAdmin = true; // TODO: user?.rol === 'ADMINISTRADOR' || user?.rol === 'ADMIN' || user?.rol === 'GERENTE';"
);
fs.writeFileSync('src/components/Layout/Sidebar.tsx', sidebar, 'utf8');

// 2. Unblock ClienteForm
let clienteForm = fs.readFileSync('src/pages/clientes/ClienteForm.tsx', 'utf8');
clienteForm = clienteForm.replace(
  "const isAdmin = user?.rol === 'ADMINISTRADOR' || user?.rol === 'ADMIN' || user?.rol === 'GERENTE';", 
  "const isAdmin = true; // TODO: user?.rol === 'ADMINISTRADOR' || user?.rol === 'ADMIN' || user?.rol === 'GERENTE';"
);
fs.writeFileSync('src/pages/clientes/ClienteForm.tsx', clienteForm, 'utf8');

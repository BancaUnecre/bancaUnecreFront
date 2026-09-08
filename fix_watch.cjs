const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const { register, handleSubmit, reset, formState: { errors } } = useForm<Empresa>",
  "const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Empresa>"
);

fs.writeFileSync(file, content, 'utf8');

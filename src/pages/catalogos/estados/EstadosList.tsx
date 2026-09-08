import React from 'react';
import CatalogPage, { type FieldDef } from '../CatalogPage';
import type { Estado } from '../../../types';
import { type Column } from '../../../components/common/DataTable';
import { estadosService } from '../../../services/estadosService';

const columns: Column<Estado>[] = [
  { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
  { key: 'clave', header: 'Clave', className: 'font-mono font-semibold text-primary-700' },
  { key: 'nombre', header: 'Nombre' },
];

const fields: FieldDef[] = [
  { key: 'id', label: 'ID', type: 'number', required: true, placeholder: 'Ej: 33', hideOnEdit: true },
  { key: 'clave', label: 'Clave (2 letras)', required: true, placeholder: 'Ej: NA' },
  { key: 'nombre', label: 'Nombre', required: true, placeholder: 'Nombre del estado' },
];

const EstadosList: React.FC = () => (
  <CatalogPage<Estado>
    title="Catálogo de Estados"
    description="Gestión de estados de la República Mexicana"
    columns={columns}
    fields={fields}
    service={estadosService}
    formTitle={isEdit => isEdit ? 'Editar Estado' : 'Nuevo Estado'}
  />
);

export default EstadosList;

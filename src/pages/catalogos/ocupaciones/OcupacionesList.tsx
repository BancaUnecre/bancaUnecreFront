import React from 'react';
import CatalogPage, { type FieldDef } from '../CatalogPage';
import type { Ocupacion } from '../../../types';
import { type Column } from '../../../components/common/DataTable';
import { ocupacionesService } from '../../../services/ocupacionesService';

const columns: Column<Ocupacion>[] = [
  { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
  { key: 'clave', header: 'Clave', className: 'font-mono font-semibold text-primary-700' },
  { key: 'descripcion', header: 'Descripción' },
];

const fields: FieldDef[] = [
  { key: 'clave', label: 'Clave (máx. 20 chars)', required: true, placeholder: 'Ej: EMP' },
  { key: 'descripcion', label: 'Descripción', required: true, placeholder: 'Descripción de la ocupación' },
];

const OcupacionesList: React.FC = () => (
  <CatalogPage<Ocupacion>
    title="Catálogo de Ocupaciones"
    description="Ocupaciones o actividades económicas de los clientes"
    columns={columns}
    fields={fields}
    service={ocupacionesService}
    formTitle={isEdit => isEdit ? 'Editar Ocupación' : 'Nueva Ocupación'}
  />
);

export default OcupacionesList;

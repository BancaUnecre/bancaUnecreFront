import React from 'react';
import CatalogPage, { type FieldDef } from '../CatalogPage';
import type { TipoIdentificacion } from '../../../types';
import { type Column } from '../../../components/common/DataTable';
import { tipoIdentificacionService } from '../../../services/tipoIdentificacionService';

const columns: Column<TipoIdentificacion>[] = [
  { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
  { key: 'clave', header: 'Clave', className: 'font-mono font-semibold text-primary-700' },
  { key: 'descripcion', header: 'Descripción' },
];

const fields: FieldDef[] = [
  { key: 'id', label: 'ID', type: 'number', required: true, placeholder: 'Ej: 6', hideOnEdit: true },
  { key: 'clave', label: 'Clave (máx. 20 chars)', required: true, placeholder: 'Ej: PASAPORTE' },
  { key: 'descripcion', label: 'Descripción', required: true, placeholder: 'Descripción del tipo de identificación' },
];

const TipoIdentificacionList: React.FC = () => (
  <CatalogPage<TipoIdentificacion>
    title="Catálogo de Tipos de Identificación"
    description="Tipos de documentos de identificación aceptados"
    columns={columns}
    fields={fields}
    service={tipoIdentificacionService}
    formTitle={isEdit => isEdit ? 'Editar Tipo de Identificación' : 'Nuevo Tipo de Identificación'}
  />
);

export default TipoIdentificacionList;

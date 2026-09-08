import React from 'react';
import CatalogPage, { type FieldDef } from '../CatalogPage';
import type { NivelCuenta } from '../../../types';
import { type Column } from '../../../components/common/DataTable';
import { nivelCuentaService } from '../../../services/nivelCuentaService';

const columns: Column<NivelCuenta>[] = [
  { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
  { key: 'nombre', header: 'Nombre', className: 'font-semibold' },
  { key: 'limite_deposito', header: 'Límite de Depósito' },
  { key: 'descripcion', header: 'Descripción' },
];

const fields: FieldDef[] = [
  { key: 'id', label: 'ID', type: 'number', required: true, placeholder: 'Ej: 4', hideOnEdit: true },
  { key: 'nombre', label: 'Nombre', required: true, placeholder: 'Nombre del nivel' },
  { key: 'limite_deposito', label: 'Límite de Depósito', required: true, placeholder: 'Ej: $8,000 MXN mensuales' },
  { key: 'descripcion', label: 'Descripción', required: true, type: 'textarea', placeholder: 'Descripción del nivel de cuenta' },
];

const NivelCuentaList: React.FC = () => (
  <CatalogPage<NivelCuenta>
    title="Catálogo Nivel de Cuenta"
    description="Niveles operativos de cuentas bancarias"
    columns={columns}
    fields={fields}
    service={nivelCuentaService}
    formTitle={isEdit => isEdit ? 'Editar Nivel de Cuenta' : 'Nuevo Nivel de Cuenta'}
  />
);

export default NivelCuentaList;

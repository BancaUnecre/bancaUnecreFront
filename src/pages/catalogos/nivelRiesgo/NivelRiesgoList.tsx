import React from 'react';
import CatalogPage, { type FieldDef } from '../CatalogPage';
import type { NivelRiesgo } from '../../../types';
import { type Column } from '../../../components/common/DataTable';
import { nivelRiesgoService } from '../../../services/nivelRiesgoService';

const riskColors: Record<string, string> = {
  'Bajo': 'bg-emerald-100 text-emerald-700',
  'Medio': 'bg-amber-100 text-amber-700',
  'Alto': 'bg-red-100 text-red-700',
  'Muy Alto': 'bg-red-200 text-red-900',
};

const columns: Column<NivelRiesgo>[] = [
  { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
  {
    key: 'nombre',
    header: 'Nivel',
    render: r => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${riskColors[r.nombre] ?? 'bg-gray-100 text-gray-700'}`}>
        {r.nombre}
      </span>
    ),
  },
  { key: 'descripcion', header: 'Descripción' },
];

const fields: FieldDef[] = [
  { key: 'id', label: 'ID', type: 'number', required: true, placeholder: 'Ej: 4', hideOnEdit: true },
  { key: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej: Bajo, Medio, Alto' },
  { key: 'descripcion', label: 'Descripción', required: true, type: 'textarea', placeholder: 'Descripción del nivel de riesgo' },
];

const NivelRiesgoList: React.FC = () => (
  <CatalogPage<NivelRiesgo>
    title="Catálogo Nivel de Riesgo"
    description="Niveles de riesgo para clasificación de clientes (PLD)"
    columns={columns}
    fields={fields}
    service={nivelRiesgoService}
    formTitle={isEdit => isEdit ? 'Editar Nivel de Riesgo' : 'Nuevo Nivel de Riesgo'}
  />
);

export default NivelRiesgoList;

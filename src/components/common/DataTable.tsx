import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
  actions?: (row: T) => React.ReactNode;
  pageSize?: number;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  toolbar?: React.ReactNode;
}

type SortDir = 'asc' | 'desc' | null;

function DataTable<T extends { id?: number | string }>({
  data, columns, loading, searchPlaceholder = 'Buscar...', onSearch, searchValue = '',
  actions, pageSize = 10, total, page = 1, onPageChange, toolbar,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [localPage, setLocalPage] = useState(1);

  React.useEffect(() => {
    if (!onPageChange) setLocalPage(1);
  }, [data, onPageChange]);

  const effectiveSearch = onSearch ? searchValue : localSearch;

  const handleSearch = (v: string) => {
    if (onSearch) onSearch(v);
    else setLocalSearch(v);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    let d = [...data];
    if (!onSearch && effectiveSearch) {
      d = d.filter(row =>
        columns.some(col => {
          const val = (row as any)[col.key];
          return val != null && String(val).toLowerCase().includes(effectiveSearch.toLowerCase());
        })
      );
    }
    if (sortKey && sortDir) {
      d.sort((a, b) => {
        const av = (a as any)[sortKey] ?? '';
        const bv = (b as any)[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return d;
  }, [data, effectiveSearch, sortKey, sortDir, onSearch, columns]);

  const totalPages = total ? Math.ceil(total / pageSize) : Math.ceil(sortedData.length / pageSize);
  const activePage = onPageChange ? page : localPage;
  const localDisplayData = onPageChange
    ? sortedData
    : sortedData.slice((localPage - 1) * pageSize, localPage * pageSize);

  const SortIcon = ({ k }: { k: string }) => {
    if (sortKey !== k) return <ChevronsUpDown size={14} className="text-gray-400" />;
    if (sortDir === 'asc') return <ChevronUp size={14} className="text-primary-600" />;
    if (sortDir === 'desc') return <ChevronDown size={14} className="text-primary-600" />;
    return <ChevronsUpDown size={14} className="text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={effectiveSearch}
            onChange={e => handleSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        {toolbar && <div className="flex gap-2">{toolbar}</div>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-800 text-white">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable !== false && handleSort(String(col.key))}
                  className={`px-4 py-3 text-left font-semibold whitespace-nowrap select-none ${col.sortable !== false ? 'cursor-pointer hover:bg-primary-700' : ''} ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable !== false && <SortIcon k={String(col.key)} />}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-center font-semibold">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  <span>Cargando...</span>
                </div>
              </td></tr>
            ) : localDisplayData.length === 0 ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-gray-400">
                No se encontraron registros
              </td></tr>
            ) : localDisplayData.map((row, i) => (
              <tr key={(row as any).id ?? i} className={`border-t border-gray-100 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                {columns.map(col => (
                  <td key={String(col.key)} className={`px-4 py-3 ${col.className || ''}`}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-center"><div className="flex gap-2 justify-center">{actions(row)}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Mostrando {((activePage - 1) * pageSize) + 1}–{Math.min(activePage * pageSize, total ?? sortedData.length)} de {total ?? sortedData.length} registros
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange ? onPageChange(page - 1) : setLocalPage(p => p - 1)}
              disabled={activePage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange ? onPageChange(p) : setLocalPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${activePage === p ? 'bg-primary-700 text-white' : 'hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange ? onPageChange(page + 1) : setLocalPage(p => p + 1)}
              disabled={activePage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;

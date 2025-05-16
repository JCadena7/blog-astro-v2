import React from "react";

interface AdminTableProps<T> {
  columns: { key: keyof T | string; label: string; className?: string; render?: (row: T) => React.ReactNode }[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  renderActions?: (row: T) => React.ReactNode;
  rowKey: (row: T) => React.Key;
}

export function AdminTable<T>({
  columns,
  data,
  loading,
  error,
  emptyMessage = "No hay datos.",
  renderActions,
  rowKey,
}: AdminTableProps<T>) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-neutral-100 dark:bg-neutral-800">
            {columns.map((col) => (
              <th
                key={col.key as string}
                className={`px-6 py-4 text-left text-neutral-700 dark:text-neutral-200 font-semibold ${col.className || ""}`}
              >
                {col.label}
              </th>
            ))}
            {renderActions && (
              <th className="px-6 py-4 text-left text-neutral-700 dark:text-neutral-200 font-semibold">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-6 py-4 text-center text-neutral-400 dark:text-neutral-400">
                Cargando...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-6 py-4 text-center text-red-500">
                {error}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-6 py-4 text-center text-neutral-400 dark:text-neutral-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={rowKey(row)} className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                {columns.map((col) => (
                  <td key={col.key as string} className={`px-6 py-4 text-neutral-900 dark:text-neutral-100 ${col.className || ""}`}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-6 py-4 flex gap-2">{renderActions(row)}</td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
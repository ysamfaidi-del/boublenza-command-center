"use client";

interface Props {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export default function DataPreview({ headers, rows, totalRows }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="card-header mb-0">Aperçu des données</h3>
        <span className="text-sm text-gray-500">{totalRows} lignes au total</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap pb-2 pr-4 text-left font-medium text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.slice(0, 10).map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap py-2 pr-4 text-gray-700">
                    {row[h] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 10 && (
          <p className="mt-3 text-center text-xs text-gray-400">
            ... et {totalRows - 10} lignes supplémentaires
          </p>
        )}
      </div>
    </div>
  );
}

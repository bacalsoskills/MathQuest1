import React from 'react';

export const Table = ({ columns, data }) => {
  const truncateText = (text, maxLength = 80) => {
    if (text === null || text === undefined) return '';
    const textStr = String(text);
    if (textStr.length <= maxLength) return textStr;
    return textStr.slice(0, maxLength) + '...';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render ? (
                    column.render(row)
                  ) : column.accessor ? (
                    typeof column.accessor === 'function' ? (
                      column.accessor(row)
                    ) : (
                      truncateText(row[column.accessor])
                    )
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 
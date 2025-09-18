import React, { useState } from 'react';

export const Table = ({ columns, data, itemsPerPage = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const truncateText = (text, maxLength = 80) => {
    if (text === null || text === undefined) return '';
    const textStr = String(text);
    if (textStr.length <= maxLength) return textStr;
    return textStr.slice(0, maxLength) + '...';
  };

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full">
      {/* Table with horizontal scroll */}
      <div className="overflow-x-auto ">
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
            {currentItems.map((row, rowIndex) => (
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
      
      {/* Pagination footer - outside the scrollable area */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 pt-5">
        <div className="text-sm dark:text-gray-300 text-gray-700">
          <span>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, data.length)} of {data.length} items</span>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-none ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'dark:text-gray-300 text-gray-700 hover:text-gray-200'
              }`}
            >
              &lt;
            </button>
            
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-none ${
                  page === currentPage
                    ? 'bg-blue-600 text-white '
                    : 'bg-transparent dark:text-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            
            {totalPages > 7 && (
              <>
                <span className="px-2">...</span>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="w-8 h-8 flex items-center justify-center rounded-none bg-transparent dark:text-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-700"
                >
                  {totalPages}
                </button>
              </>
            )}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded-none ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'dark:text-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 
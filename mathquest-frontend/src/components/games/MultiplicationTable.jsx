import React from 'react';

const MultiplicationTable = ({ onClose }) => {
  const headers = Array.from({ length: 10 }, (_, i) => i + 1);
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-700">Multiplication Table (1-10)</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close multiplication table"
          >
            &times;
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-purple-300">
            <thead>
              <tr>
                <th className="p-2 border border-purple-300 bg-purple-500 text-white">×</th>
                {headers.map(header => (
                  <th key={header} className="p-2 border border-purple-300 bg-purple-500 text-white text-center">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(rowNum => (
                <tr key={rowNum} className="even:bg-purple-50">
                  <td className="p-2 border border-purple-300 bg-purple-500 text-white font-bold text-center">{rowNum}</td>
                  {headers.map(colNum => (
                    <td key={`${rowNum}-${colNum}`} className="p-2 border border-purple-300 text-center text-gray-700">
                      {rowNum * colNum}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiplicationTable; 
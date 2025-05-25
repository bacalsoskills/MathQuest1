import React, { useState, useRef, useEffect } from 'react';
import { HiDotsVertical, HiPencil, HiTrash } from 'react-icons/hi';

const Table = ({ columns, data, onEdit, onDelete, onAdd, addLabel }) => {
  const [actionMenuOpen, setActionMenuOpen] = useState(null); // Stores ID of row whose menu is open
  const menuRef = useRef();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActionMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No data available.</p>
        {onAdd && (
          <button 
            onClick={onAdd}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-150"
          >
            {addLabel || 'Add New'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - visually similar to image's header but adaptable */}
      <div className="hidden lg:flex bg-gray-50 p-4 rounded-lg shadow-sm sticky top-0 z-10">
        {columns.map((column) => (
          <div 
            key={column.accessor || column.header} 
            className="flex-1 px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
          >
            {column.header}
          </div>
        ))}
        <div className="w-20 px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Actions
        </div>
      </div>

      {/* Data Rows (Cards) */}
      {data.map((row) => (
        <div 
          key={row.id} 
          className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow duration-200 ease-in-out"
        >
          <div className="flex flex-col lg:flex-row lg:items-center">
            {columns.map((column) => (
              <div key={column.accessor || column.header} className="flex-1 py-2 px-3 lg:py-0">
                <span className="lg:hidden text-xs font-semibold text-gray-500">{column.header}: </span>
                <span className="text-sm text-gray-800">
                  {column.render ? column.render(row) : row[column.accessor]}
                </span>
              </div>
            ))}
            <div className="w-full lg:w-20 py-2 px-3 lg:py-0 lg:text-center mt-3 lg:mt-0 border-t lg:border-t-0 pt-3 lg:pt-0">
              <div className="relative inline-block text-left" ref={actionMenuOpen === row.id ? menuRef : null}>
                <button
                  onClick={() => setActionMenuOpen(actionMenuOpen === row.id ? null : row.id)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition duration-150"
                >
                  <HiDotsVertical size={20} />
                </button>
                {actionMenuOpen === row.id && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      {onEdit && (
                        <button
                          onClick={() => { onEdit(row); setActionMenuOpen(null); }}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                        >
                          <HiPencil className="mr-3 h-5 w-5 text-gray-400" />
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => { onDelete(row); setActionMenuOpen(null); }}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                          role="menuitem"
                        >
                          <HiTrash className="mr-3 h-5 w-5 text-red-400" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Table; 
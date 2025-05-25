import React from 'react';
import { useContent } from '../../context/ContentContext';

const PropertiesSection = () => {
  const { properties, updateContent } = useContent();

  const handleEdit = (property) => {
    // Implement edit functionality
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      updateContent('properties', id, null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Properties</h2>
      <div className="space-y-4">
        {properties.map(property => (
          <div key={property.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{property.name}</h4>
                <p className="text-gray-600">{property.formula}</p>
                <p className="text-sm text-gray-500">{property.description}</p>
                <p className="text-sm text-gray-500">Example: {property.example}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(property)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(property.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertiesSection; 
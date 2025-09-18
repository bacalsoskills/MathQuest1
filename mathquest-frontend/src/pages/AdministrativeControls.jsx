import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from "../ui/heading"

const AdministrativeControls = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('system');
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    emailNotifications: true,
    passwordPolicy: {
      minLength: 8,
      requireNumbers: true,
      requireSpecialChars: true,
      requireUppercase: true
    },
    contentSettings: {
      maxFileSize: 5, // MB
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
      autoSaveInterval: 5 // minutes
    },
    notificationSettings: {
      emailOnLogin: true,
      emailOnPasswordChange: true,
      emailOnRoleChange: true,
      emailOnSystemUpdate: true
    }
  });
  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin', permissions: ['all'] },
    { id: 2, name: 'Teacher', permissions: ['view_reports', 'manage_content'] },
    { id: 3, name: 'Student', permissions: ['view_content', 'submit_answers'] }
  ]);
  const [newRole, setNewRole] = useState({
    name: '',
    permissions: []
  });

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  const handleSystemSettingChange = (setting, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSystemSettings = () => {
    // TODO: Implement API call to save system settings

    alert('System settings saved successfully!');
  };

  const handleAddRole = () => {
    if (newRole.name && newRole.permissions.length > 0) {
      setRoles(prev => [...prev, {
        id: Date.now(),
        name: newRole.name,
        permissions: newRole.permissions
      }]);
      setNewRole({ name: '', permissions: [] });
    }
  };

  const handleDeleteRole = (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(prev => prev.filter(role => role.id !== roleId));
    }
  };

  return (
    // <div className="space-y-6">
    //   <h2 className="text-2xl font-bold text-gray-800 mb-6">Administrative Controls</h2>

    //   {/* Tabs */}
    //   <div className="flex space-x-4 mb-8">
    //     <button
    //       onClick={() => setActiveTab('system')}
    //       className={`px-4 py-2 rounded-md ${
    //         activeTab === 'system'
    //           ? 'bg-blue-600 text-white'
    //           : 'bg-white text-gray-600 hover:bg-blue-50'
    //       }`}
    //     >
    //       System Configuration
    //     </button>
    //     <button
    //       onClick={() => setActiveTab('roles')}
    //       className={`px-4 py-2 rounded-md ${
    //         activeTab === 'roles'
    //           ? 'bg-blue-600 text-white'
    //           : 'bg-white text-gray-600 hover:bg-blue-50'
    //       }`}
    //     >
    //       User Role Management
    //     </button>
    //   </div>

    //   {/* Content */}
    //   <div className="bg-white rounded-lg shadow p-6">
    //     {activeTab === 'system' && (
    //       <div>
    //         <h3 className="text-xl font-semibold mb-4">System Configuration</h3>
            
    //         {/* Security Settings */}
    //         <div className="mb-8 p-4 border rounded-lg">
    //           <h4 className="text-lg font-semibold mb-4">Security Settings</h4>
    //           <div className="space-y-4">
    //             <div className="flex items-center justify-between">
    //               <span>Maintenance Mode</span>
    //               <label className="relative inline-flex items-center cursor-pointer">
    //                 <input
    //                   type="checkbox"
    //                   className="sr-only peer"
    //                   checked={systemSettings.maintenanceMode}
    //                   onChange={(e) => handleSystemSettingChange('maintenanceMode', e.target.checked)}
    //                 />
    //                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    //               </label>
    //             </div>

    //             <div className="flex items-center justify-between">
    //               <span>Registration Enabled</span>
    //               <label className="relative inline-flex items-center cursor-pointer">
    //                 <input
    //                   type="checkbox"
    //                   className="sr-only peer"
    //                   checked={systemSettings.registrationEnabled}
    //                   onChange={(e) => handleSystemSettingChange('registrationEnabled', e.target.checked)}
    //                 />
    //                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    //               </label>
    //             </div>

    //             <div className="flex items-center justify-between">
    //               <span>Max Login Attempts</span>
    //               <input
    //                 type="number"
    //                 className="w-20 p-2 border rounded"
    //                 value={systemSettings.maxLoginAttempts}
    //                 onChange={(e) => handleSystemSettingChange('maxLoginAttempts', parseInt(e.target.value))}
    //                 min="1"
    //                 max="10"
    //               />
    //             </div>

    //             <div className="flex items-center justify-between">
    //               <span>Session Timeout (minutes)</span>
    //               <input
    //                 type="number"
    //                 className="w-20 p-2 border rounded"
    //                 value={systemSettings.sessionTimeout}
    //                 onChange={(e) => handleSystemSettingChange('sessionTimeout', parseInt(e.target.value))}
    //                 min="5"
    //                 max="120"
    //               />
    //             </div>
    //           </div>
    //         </div>

    //         {/* Password Policy */}
    //         <div className="mb-8 p-4 border rounded-lg">
    //           <h4 className="text-lg font-semibold mb-4">Password Policy</h4>
    //           <div className="space-y-4">
    //             <div className="flex items-center justify-between">
    //               <span>Minimum Password Length</span>
    //               <input
    //                 type="number"
    //                 className="w-20 p-2 border rounded"
    //                 value={systemSettings.passwordPolicy.minLength}
    //                 onChange={(e) => handleSystemSettingChange('passwordPolicy', {
    //                   ...systemSettings.passwordPolicy,
    //                   minLength: parseInt(e.target.value)
    //                 })}
    //                 min="6"
    //                 max="20"
    //               />
    //             </div>

    //             <div className="flex items-center justify-between">
    //               <span>Require Numbers</span>
    //               <label className="relative inline-flex items-center cursor-pointer">
    //                 <input
    //                   type="checkbox"
    //                   className="sr-only peer"
    //                   checked={systemSettings.passwordPolicy.requireNumbers}
    //                   onChange={(e) => handleSystemSettingChange('passwordPolicy', {
    //                     ...systemSettings.passwordPolicy,
    //                     requireNumbers: e.target.checked
    //                   })}
    //                 />
    //                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    //               </label>
    //             </div>

    //             <div className="flex items-center justify-between">
    //               <span>Require Special Characters</span>
    //               <label className="relative inline-flex items-center cursor-pointer">
    //                 <input
    //                   type="checkbox"
    //                   className="sr-only peer"
    //                   checked={systemSettings.passwordPolicy.requireSpecialChars}
    //                   onChange={(e) => handleSystemSettingChange('passwordPolicy', {
    //                     ...systemSettings.passwordPolicy,
    //                     requireSpecialChars: e.target.checked
    //                   })}
    //                 />
    //                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    //               </label>
    //             </div>

    //             <div className="flex items-center justify-between">
    //               <span>Require Uppercase</span>
    //               <label className="relative inline-flex items-center cursor-pointer">
    //                 <input
    //                   type="checkbox"
    //                   className="sr-only peer"
    //                   checked={systemSettings.passwordPolicy.requireUppercase}
    //                   onChange={(e) => handleSystemSettingChange('passwordPolicy', {
    //                     ...systemSettings.passwordPolicy,
    //                     requireUppercase: e.target.checked
    //                   })}
    //                 />
    //                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    //               </label>
    //             </div>
    //           </div>
    //         </div>

    //         <button
    //           onClick={handleSaveSystemSettings}
    //           className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    //         >
    //           Save System Settings
    //         </button>
    //       </div>
    //     )}

    //     {activeTab === 'roles' && (
    //       <div>
    //         <h3 className="text-xl font-semibold mb-4">User Role Management</h3>
            
    //         {/* Add New Role */}
    //         <div className="mb-8 p-4 border rounded-lg">
    //           <h4 className="text-lg font-semibold mb-4">Add New Role</h4>
    //           <div className="space-y-4">
    //             <div>
    //               <label className="block text-sm font-medium text-gray-700 mb-2">
    //                 Role Name
    //               </label>
    //               <input
    //                 type="text"
    //                 className="w-full p-2 border rounded"
    //                 value={newRole.name}
    //                 onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
    //               />
    //             </div>
    //             <div>
    //               <label className="block text-sm font-medium text-gray-700 mb-2">
    //                 Permissions
    //               </label>
    //               <select
    //                 multiple
    //                 className="w-full p-2 border rounded"
    //                 value={newRole.permissions}
    //                 onChange={(e) => setNewRole({
    //                   ...newRole,
    //                   permissions: Array.from(e.target.selectedOptions, option => option.value)
    //                 })}
    //               >
    //                 <option value="view_content">View Content</option>
    //                 <option value="manage_content">Manage Content</option>
    //                 <option value="view_reports">View Reports</option>
    //                 <option value="manage_users">Manage Users</option>
    //                 <option value="submit_answers">Submit Answers</option>
    //                 <option value="all">All Permissions</option>
    //               </select>
    //             </div>
    //             <button
    //               onClick={handleAddRole}
    //               className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
    //             >
    //               Add Role
    //             </button>
    //           </div>
    //         </div>

    //         {/* Existing Roles */}
    //         <div className="space-y-4">
    //           {roles.map((role) => (
    //             <div key={role.id} className="p-4 border rounded-lg">
    //               <div className="flex justify-between items-start">
    //                 <div>
    //                   <h4 className="font-semibold">{role.name}</h4>
    //                   <div className="mt-2">
    //                     <p className="text-sm text-gray-600">Permissions:</p>
    //                     <ul className="list-disc list-inside ml-4">
    //                       {role.permissions.map((permission, index) => (
    //                         <li key={index} className="text-sm text-gray-600">
    //                           {permission}
    //                         </li>
    //                       ))}
    //                     </ul>
    //                   </div>
    //                 </div>
    //                 {role.name !== 'Admin' && (
    //                   <button
    //                     onClick={() => handleDeleteRole(role.id)}
    //                     className="text-red-600 hover:text-red-800"
    //                   >
    //                     Delete
    //                   </button>
    //                 )}
    //               </div>
    //             </div>
    //           ))}
    //         </div>
    //       </div>
    //     )}
    //   </div>
    // </div>

    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        <div className="max-w-5xl mx-auto">
           <Header type="h1" fontSize="3xl" weight="bold" className="mb-6 text-center">Not yet available</Header>
        </div>
    </div>  
  );
};

export default AdministrativeControls; 
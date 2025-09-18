import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../../ui/heading';
import UserService from '../../services/userService';
import { Table } from '../../ui/table';
import { Button } from '../../ui/button';
import Modal from '../../ui/modal';
import { Input } from '../../ui/input';
import { CiSearch } from 'react-icons/ci';
import { HiDotsVertical, HiPencil, HiTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const menuRef = useRef();
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await UserService.getAllUsers();

      
      // Sort users: admins first, then alphabetically by last name
      const sortedUsers = allUsers
        .filter(user => !user.isDeleted && !user.deleted) // Check both isDeleted and deleted flags
        .sort((a, b) => {
          // Check if user is admin
          const aIsAdmin = a.roles?.some(r => {
            const roleName = typeof r === 'string' ? r : r.name;
            return roleName === 'ROLE_ADMIN' || roleName === 'ADMIN';
          });
          const bIsAdmin = b.roles?.some(r => {
            const roleName = typeof r === 'string' ? r : r.name;
            return roleName === 'ROLE_ADMIN' || roleName === 'ADMIN';
          });

          // If one is admin and other isn't, admin comes first
          if (aIsAdmin && !bIsAdmin) return -1;
          if (!aIsAdmin && bIsAdmin) return 1;

          // If both are admin or both are not admin, sort by ID
          return a.id - b.id;
        });



      setUsers(sortedUsers);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to fetch users. Please try again later.');
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.roles?.[0] || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const userToDelete = users.find(user => user.id === userId);
        const response = await UserService.deleteUserByAdmin(userId);
        toast.success('User deleted successfully');
        await fetchUsers(); // Wait for the fetch to complete
        

      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...editForm,
        createdByAdmin: true,
        temporaryPassword: editForm.password || undefined
      };
      
      await UserService.updateUserByAdmin(selectedUser.id, userData);
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    }
  };

  const filterUsers = (users) => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A' },
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      accessor: (user) => user.roles?.map(role => {
        const roleName = typeof role === 'string' ? role : role.name;
        return roleName.replace('ROLE_', '');
      }).join(', ') || 'N/A'
    },
    {
      header: 'Actions',
      accessor: (user) => (
        <div className="flex justify-start">
          <div className="relative inline-block text-left" ref={actionMenuOpen === user.id ? menuRef : null}>
            <button
              onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition duration-150"
            >
              <HiDotsVertical size={20} />
            </button>
            {actionMenuOpen === user.id && (
            <div className="absolute right-0 bottom-[5%] mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <button
                    onClick={() => { handleEditUser(user); setActionMenuOpen(null); }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    <HiPencil className="mr-3 h-5 w-5 text-gray-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => { handleDeleteUser(user.id); setActionMenuOpen(null); }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                    role="menuitem"
                  >
                    <HiTrash className="mr-3 h-5 w-5 text-red-400" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return <div>{error}</div>;

  const filteredUsers = filterUsers(users);

  return (
    <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
    <div className="max-w-6xl mx-auto">
    <Header type="h1" fontSize="5xl" weight="bold" className="mb-6 text-primary dark:text-white"> User Management</Header>
    <div className="h-[1px] w-full bg-gradient-to-r from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] mb-5 md:mb-8"></div>
      
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto order-2 sm:order-1">
            <div className="relative flex-1 sm:flex-none">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none dark:!text-gray-300 !text-gray-700">
                <CiSearch className="dark:!text-gray-300 !text-gray-700" />
              </div>
              <Input
                type="search"
                name="search"
                id="search"
                className="block w-full sm:w-96 pl-10 pr-3 py-2 sm:text-sm border-gray-700 dark:border-gray-300 text-gray-500 dark:text-gray-300"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

      <div className="">
        <Table columns={columns} data={filteredUsers} />
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block mb-2text-sm font-medium dark:text-gray-300 text-gray-700">First Name</label>
            <Input
              type="text"
              className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Last Name</label>
            <Input
              type="text"
              className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Username</label>
            <Input
              type="text"
              className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">Email</label>
            <Input
              type="email"
              className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium dark:text-gray-300 text-gray-700">New Password (optional)</label>
            <Input
              type="password"
              className="dark:text-gray-300 text-gray-700 dark:border-gray-300 border-gray-700"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="cancel" rounded="full" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" rounded="full">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
    </div>
  );
};

export default UserManagement; 
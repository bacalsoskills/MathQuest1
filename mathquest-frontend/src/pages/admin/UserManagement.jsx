import React, { useState, useEffect } from 'react';
import { Header } from '../../ui/heading';
import UserService from '../../services/userService';
import { Table } from '../../ui/table';
import { Button } from '../../ui/button';
import Modal from '../../ui/modal';
import { Input } from '../../ui/input';
import { CiSearch } from 'react-icons/ci';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await UserService.getAllUsers();
      console.log('Fetched all users:', {
        total: allUsers.length,
        deleted: allUsers.filter(user => user.isDeleted || user.deleted).length,
        active: allUsers.filter(user => !user.isDeleted && !user.deleted).length
      });
      
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

      console.log('Filtered and sorted users:', {
        total: sortedUsers.length,
        admins: sortedUsers.filter(user => user.roles?.some(r => {
          const roleName = typeof r === 'string' ? r : r.name;
          return roleName === 'ROLE_ADMIN' || roleName === 'ADMIN';
        })).length,
        nonAdmins: sortedUsers.filter(user => !user.roles?.some(r => {
          const roleName = typeof r === 'string' ? r : r.name;
          return roleName === 'ROLE_ADMIN' || roleName === 'ADMIN';
        })).length,
        userIds: sortedUsers.map(u => u.id)
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
        console.log('Attempting to delete user:', {
          id: userId,
          name: `${userToDelete?.firstName || ''} ${userToDelete?.lastName || ''}`.trim(),
          email: userToDelete?.email,
          roles: userToDelete?.roles,
          isDeleted: userToDelete?.isDeleted
        });
        
        const response = await UserService.deleteUserByAdmin(userId);
        console.log('Delete API Response:', response);
        
        // Verify deletion in the current list
        const deletedUser = users.find(user => user.id === userId);
        console.log('Verification after deletion:', {
          userId,
          stillExists: !!deletedUser,
          isDeleted: deletedUser?.isDeleted
        });
        
        console.log('Successfully deleted user with ID:', userId);
        toast.success('User deleted successfully');
        await fetchUsers(); // Wait for the fetch to complete
        
        // Verify after refresh
        const allUsers = await UserService.getAllUsers();
        const deletedUserAfterRefresh = allUsers.find(user => user.id === userId);
        console.log('Verification after refresh:', {
          userId,
          stillExists: !!deletedUserAfterRefresh,
          isDeleted: deletedUserAfterRefresh?.isDeleted
        });
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
        <div className="flex space-x-2">
          <Button onClick={() => handleEditUser(user)} variant="secondary">
            Edit
          </Button>
          <Button onClick={() => handleDeleteUser(user.id)} variant="danger">
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const filteredUsers = filterUsers(users);

  return (
    <div className="container mx-auto px-4 py-8">
      <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">User Management</Header>
      
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !text-gray-800">
            <CiSearch />
          </div>
          <Input
            type="search"
            name="search"
            id="search"
            className="block w-full sm:w-64 pl-10 pr-3 py-2 sm:text-sm !text-gray-800"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <Table columns={columns} data={filteredUsers} />
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <Input
              type="text"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <Input
              type="text"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <Input
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
            <Input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement; 
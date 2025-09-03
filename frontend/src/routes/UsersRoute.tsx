import React, { useEffect } from 'react';
import UserManagement from '../../components/UserManagement';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export function UsersRoute() {
  const { user } = useAuth();
  const { 
    users, 
    loading, 
    errors, 
    createUser, 
    updateUser, 
    deleteUser,
    fetchUsers
  } = useData();

  // Fetch users when component mounts - only once
  useEffect(() => {
    if (user?.role === "Admin") {
      fetchUsers();
    }
  }, []); // Remove fetchUsers from dependency array to prevent infinite loop

  // Toggle user status handler
  const handleToggleUserStatus = (id: string) => {
    const currentUser = users.find((u) => u.id === id);
    if (currentUser) {
      const newStatus = currentUser.status === "Active" ? "Inactive" : "Active";
      updateUser(id, { status: newStatus });
    }
  };

  // Only render for Admin or Treasurer
  if (user?.role !== "Admin" && user?.role !== "Treasurer") {
    return null;
  }

  return (
    <UserManagement
      users={users}
      onAddUser={createUser}
      onEditUser={updateUser}
      onDeleteUser={deleteUser}
      onToggleUserStatus={handleToggleUserStatus}
      currentUser={user}
      loading={loading.users}
      error={errors.users}
    />
  );
}
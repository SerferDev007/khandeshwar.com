import React, { useEffect, useRef } from 'react';
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

  // Guard to ensure fetchUsers is only called once per component mount lifecycle
  const initializedRef = useRef(false);

  // Fetch users when component mounts - only once per mount, and only for Admin or Treasurer
  useEffect(() => {
    // Include both Admin and Treasurer roles (fixes role gating mismatch)
    if ((user?.role === "Admin" || user?.role === "Treasurer") && !initializedRef.current) {
      console.debug('🔍 UsersRoute: Fetching users for user role:', user.role);
      initializedRef.current = true;
      fetchUsers();
    }
  }, [user?.role, fetchUsers]); // Include user.role to re-run if role changes

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
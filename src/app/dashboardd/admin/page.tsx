'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

interface User {
  id: string;
  uid: string;
  username: string;
  email: string;
  role: string;
  provider?: string;
  disabled?: boolean;
}

interface NewUser {
  username: string;
  email: string;
  role: string;
  password: string;
}

const AdminPage = () => {
  const { userProfile, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<NewUser>({ username: '', email: '', role: 'user', password: '' });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [processing, setProcessing] = useState(false);
  const auth = getAuth();

  // 🔹 Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersList = snapshot.docs.map((d) => ({
          id: d.id,
          uid: d.id, // ✅ نفس الـ id = uid
          ...(d.data() as Omit<User, 'id' | 'uid'>),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // 🔹 Add new user
  const handleAddUser = async () => {
    if (!newUser.email || !newUser.username || !newUser.password) return;
    if (users.some((u) => u.email === newUser.email)) {
      alert("This email is already used. Choose another one.");
      return;
    }

    setProcessing(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        disabled: false,
        createdAt: new Date(),
      });

      setUsers([...users, { id: uid, uid, username: newUser.username, email: newUser.email, role: newUser.role }]);
      setNewUser({ username: '', email: '', role: 'user', password: '' });
      alert("✅ User added successfully!");
    } catch (error: any) {
      console.error(error);
      alert("Error adding user: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 🔹 Update user role
  const handleUpdateRole = async (id: string, role: string) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'users', id), { role });
      setUsers(users.map(u => u.id === id ? { ...u, role } : u));
      alert(`✅ User updated to role: ${role}`);
    } catch (error: any) {
      console.error(error);
      alert("Error updating role: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 🔹 Delete user
  const handleDeleteUser = async (uid: string, docId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== docId));
      alert('✅ User deleted successfully!');
    } catch (error: any) {
      console.error(error);
      alert('Error deleting user: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 🔹 Reset user password
  const handleResetPassword = async (email: string) => {
    if (!confirm(`Send password reset email to ${email}?`)) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reset password');
      }

      alert(`✅ Password reset email sent to ${email}`);
    } catch (error: any) {
      console.error(error);
      alert('Error resetting password: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 🔹 Enable / Disable user
  const handleToggleUserStatus = async (uid: string, docId: string, currentStatus?: boolean) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/toggle-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, disabled: !currentStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user status');
      }

      setUsers(users.map(u => u.id === docId ? { ...u, disabled: !currentStatus } : u));
      alert(`✅ User has been ${currentStatus ? 'enabled' : 'disabled'}.`);
    } catch (error: any) {
      console.error(error);
      alert('Error toggling user: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <p className="text-center text-gray-500 mt-10">Loading...</p>;
  if (!userProfile || userProfile.role !== 'admin') {
    return <p className="text-center text-red-500 mt-10">Access denied. Only admins can view this page.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">🧭 Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome, <span className="font-medium">{userProfile.username}</span>!</p>

        <h2 className="text-xl font-semibold text-gray-700 mb-4">All Users</h2>

        {loadingUsers ? (
          <p className="text-center text-gray-500">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition`}>
                    <td className="px-6 py-4 text-gray-800">{u.username}</td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        disabled={processing}
                        onClick={() => handleUpdateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                        className="px-3 py-1 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Make {u.role === 'admin' ? 'User' : 'Admin'}
                      </button>
                      <button
                        disabled={processing}
                        onClick={() => handleResetPassword(u.email)}
                        className="px-3 py-1 text-sm rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reset Password
                      </button>
                      <button
                        disabled={processing}
                        onClick={() => handleToggleUserStatus(u.uid, u.id, u.disabled)}
                        className={`px-3 py-1 text-sm rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          u.disabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
                        }`}
                      >
                        {u.disabled ? 'Enable' : 'Disable'}
                      </button>
                      <button
                        disabled={processing}
                        onClick={() => handleDeleteUser(u.uid, u.id)}
                        className="px-3 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-700 mt-10 mb-4">Add New User</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            placeholder="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full"
          />
          <input
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full"
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            disabled={processing}
            onClick={handleAddUser}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add User
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

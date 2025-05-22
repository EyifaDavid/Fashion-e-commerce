import React from 'react';
import { useSelector } from 'react-redux';
import { Outlet, NavLink } from 'react-router-dom';
import Button from '../../components/Button';
import Sidebar from '../../components/Sidebar';

export default function AdminDashboard() {
  const { user } = useSelector((state) => state.auth);

  if (!user || !user.isAdmin) {
    return <div className="text-red-600">Access denied. Admins only.</div>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar/>
      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-300">
        <Outlet />
      </main>
    </div>
  );
}

import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';


const AdminUsers = () => {
  const users = useSelector((state) => state.users.allUsers || []);

  return (
    <div className="p-0 md:p-6">
      <h1 className="text-2xl font-bold text-white mb-4">User List</h1>

      <div className="overflow-x-auto text-xs md:text-base shadow rounded-lg">
        <table className="min-w-full bg-white ">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Email</th>
              <th className="text-left p-3 font-semibold">Role</th>
              <th className="text-left p-3 font-semibold">Joined On</th>
              <th className="text-left p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role}</td>
                <td className="p-3">{user.joinedAt}</td>
                <td className="p-3">
                  <Link to={`/user/${user.id}`} className="text-blue-500 hover:underline">View</Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="text-center p-4">No users available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;

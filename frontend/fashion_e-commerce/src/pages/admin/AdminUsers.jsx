import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { useGetUserListQuery } from '../../redux/slices/api/userApiSlice';

const AdminUsers = () => {
  const { data: users = [], isLoading, error, refetch } = useGetUserListQuery();

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
      </div>
    );

  if (error) return <p>Error loading users: {error.message}</p>;

  return (
    <div className="p-0 md:p-6">
      <h1 className="text-2xl font-bold text-white mb-4">User List</h1>

      <div className="overflow-x-auto text-xs md:text-base shadow rounded-lg">
        <table className="min-w-full bg-white">
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
            {users.length > 0 ? (
              users.map((user) => {
                const joinedDate = user.joinedOn
                  ? moment(user.joinedOn).format('MMMM Do, YYYY')
                  : 'N/A';
                return (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3 capitalize">{user.role}</td>
                    <td className="p-3">{joinedDate}</td>
                    <td className="p-3">
                      <Link to={`/user/${user._id}`} className="text-blue-500 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No users available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;

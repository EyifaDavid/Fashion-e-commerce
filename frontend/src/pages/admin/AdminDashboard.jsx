import React, { Fragment, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, NavLink } from 'react-router-dom';
import Button from '../../components/Button';
import Sidebar from '../../components/Sidebar';
import { setOpenSidebar } from '../../redux/slices/authSlice';
import { Transition } from '@headlessui/react';
import clsx from 'clsx';
import { IoClose } from 'react-icons/io5';
import AdminNavbar from '../../components/AdminNavbar';

export default function AdminDashboard() {

  const { user } = useSelector((state) => state.auth);

  if (!user || !user.isAdmin) {
    return <div className="text-red-600">Access denied. Admins only.</div>;
  }

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row">
    
      {/* Sidebar */}
      <div className="w-1/5 h-screen bg-white dark:bg-gray-800 sticky top-0 hidden md:block">
        <Sidebar/>
      </div>
      <MobileSidebar/>
      {/* Main content */}
        <div className="flex-1 Overflow-y-auto bg-gray-500 ">
        <AdminNavbar/>

        <div className="p-4 2xl:px-10">
        <Outlet/>
       </div>
       </div>
       </div>
  );
}


const MobileSidebar = ()=>{
  const {isSidebarOpen} = useSelector((state)=>state.auth);
  const mobileMenuRef = useRef(null)
  const dispatch = useDispatch();

  const closeSidebar = ()=> {
    dispatch(setOpenSidebar(false))
  }

  return(
    <>
    <Transition show={isSidebarOpen} as={Fragment}>
  <div className="fixed inset-0 z-50 flex">
    {/* Overlay */}
    <div
      className="fixed inset-0 bg-black/40"
      onClick={closeSidebar}
    />

    {/* Sliding panel */}
    <Transition.Child
      as={Fragment}
      enter="transition ease-in-out duration-300 transform"
      enterFrom="-translate-x-full"
      enterTo="translate-x-0"
      leave="transition ease-in-out duration-300 transform"
      leaveFrom="translate-x-0"
      leaveTo="-translate-x-full"
    >
      <div
        className="relative w-3/5 max-w-xs h-full bg-white dark:bg-gray-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-4">
          <button onClick={closeSidebar}>
            <IoClose size={24} />
          </button>
        </div>
        <Sidebar />
      </div>
    </Transition.Child>
  </div>
</Transition>
    </>
  )
}

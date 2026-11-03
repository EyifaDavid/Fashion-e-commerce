import {Menu,MenuButton,MenuItem,MenuItems,Transition} from "@headlessui/react"
import { Fragment, useState } from 'react'
import { FaUser, FaUserLock } from 'react-icons/fa'
import {IoLogOutOutline} from "react-icons/io5"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useLogoutMutation } from "../redux/slices/api/authApiSlice"
import { logout } from "../redux/slices/authSlice"
import { toast } from "sonner"
import AddUser from "./AddUser"
import ChangePassword from "./ChangePassword"
import { MdOutlinePerson } from "react-icons/md"

const UserAvatar = () => {
    const [open,setOpen] = useState(false);
    const [openPassword, setOpenPassword] = useState(false);
    const {user}= useSelector((state)=>state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [logoutUser]= useLogoutMutation()
    const logoutHandler = async () => {
      try{
        await logoutUser().unwrap();
        dispatch(logout());

        navigate("/log-in");
      }catch{
        toast.error("Something went wrong");
      }
    };


  return (
   <>
    <div className="flex items-center justify-center">
    <Menu as="div" className="relative inline-block text-left">
        <div>
            <MenuButton className="north-icon-control" aria-label="Profile" title="Profile" data-north-header-action="profile">
               <MdOutlinePerson size={22} aria-hidden="true" />
            </MenuButton>
        </div>

        <Transition
        as={Fragment}
        enter='transition ease-out duration-100'
        enterFrom='transform opacity-0 scale-95 motion-reduce:transform-none'
        enterTo='transform opacity-100 scale-100 motion-reduce:transform-none'
        leave='transition ease-out duration-100'
        leaveFrom='transform opacity-100 scale-100 motion-reduce:transform-none'
        leaveTo='transform opacity-0 scale-95 motion-reduce:transform-none'
      >

        <MenuItems className='absolute right-0 z-40 mt-2 w-56 origin-top-right divide-gray-100 bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5 focus:outline-none'>
          <div className='p-4'>
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={() => setOpen(true)}
                  className={'text-gray-700 group flex w-full items-center px-2 py-2 text-base ' + (focus ? 'bg-neutral-100' : '')}
                >
                  <FaUser className='mr-2' aria-hidden='true' />
                  Profile
                </button>
              )}
            </MenuItem>
            
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={() => setOpenPassword(true)}
                  className={'text-gray-700 group flex w-full items-center px-2 py-2 text-base ' + (focus ? 'bg-neutral-100' : '')}
                >
                  <FaUserLock className='mr-2' aria-hidden='true' />
                  Change Password
                </button>
              )}
            </MenuItem>

            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={logoutHandler}
                  className={'text-red-600 group flex w-full items-center px-2 py-2 text-base ' + (focus ? 'bg-neutral-100' : '')}
                >
                  <IoLogOutOutline className='mr-2' aria-hidden='true' />
                  Logout
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
</Transition>
    </Menu>
</div>

  <AddUser open= {open} setOpen={setOpen} userData={user }/>
  <ChangePassword open={openPassword }setOpen={setOpenPassword}/>
  </>
  );
};

export default UserAvatar

import React from 'react';
import { FaBox, FaBoxOpen, FaHome, FaTasks, FaTrashAlt, FaUsers } from "react-icons/fa";
import { MdDashboard, MdDashboardCustomize, MdInventory, MdOutlineAddTask, MdOutlineDashboard, MdOutlinePendingActions, MdSettings, MdShoppingBag, MdTaskAlt } from "react-icons/md";
import { useDispatch, useSelector } from 'react-redux';
import devX from "../assets/images/devx.jpg"
import { Link, NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { setOpenSidebar } from '../redux/slices/authSlice';


const linkData =[
{
    Label:"Dashboard",
    link:"dashboard",
    icon:<MdDashboard/>,
},
{
    Label:"Products",
    link:"products",
    icon:<FaBoxOpen/>,
},
{
    Label:"Inventory",
    link:"inventory",
    icon:<MdInventory/>,
},
{
    Label:"Orders",
    link:"orders",
    icon:<MdShoppingBag/>,
},
{
    Label:"Users",
    link:"users",
    icon:<FaUsers/>,
},

]




const Sidebar = () => {

    const {user}= useSelector((state)=>state.auth);

    const dispatch = useDispatch()
    const location = useLocation()
    
    const path = location.pathname.split("/")[1]

    const sidebarLinks = user?.isAdmin ? linkData : linkData.slice(0,5);

    const closeSidebar =()=>{
        dispatch(setOpenSidebar(false));
    }

    const NavLink =({el}) => {
        return(
            <Link to={el.link} onClick={closeSidebar}
            className={clsx("w-full lg:w-3/4 flex gap-2 px-3 py-2 rounded-full items-center text-gray-800  text-base hover:bg-[#2564ed2d]",
                path === el.link.split("/")[0] ? "bg-blue-700 text-white " : "not-only:"
            )}>
                {el.icon}
                <span className='hover:text-[#2564ed]'>{el.Label}</span>
            </Link>
        )
    }
  return (
    <div className=' min-h-full flex flex-col gap-6 p-5  bg-[#F5F5F5]'>

        <div className='flex items-center  '>
        <img src={devX}
        className=' p-2 rounded-full w-20'>
        </img>
        <span className='text-2xl font-bold text-black '>Shop</span>
        </div>
        
        <div className='flex-1 flex-col gap-y-5 py-8'>
            {
                sidebarLinks.map((link)=>(
                    <NavLink el={link} key={link.Label}/>
                ))
            }
        </div>
    </div>
  )
}

export default Sidebar
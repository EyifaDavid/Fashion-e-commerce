import React from "react";
import { MdOutlineFlagCircle, MdOutlinePerson, MdOutlinePerson2, MdOutlineSearch, MdOutlineShoppingBag, MdOutlineShowChart, MdPerson, MdPerson2, MdShoppingBag, MdShoppingCart } from 'react-icons/md'
import { IoMdClose, IoMdPerson } from "react-icons/io";
import { useDispatch,useSelector } from 'react-redux'
import { setOpenSidebar } from '../redux/slices/authSlice';
// import UserAvatar from './UserAvatar';
// import NotificationPanel from './NotificationPanel';

const Navbar = () => {

  const {user}= useSelector((state)=>state.auth);
  const dispatch = useDispatch()

return (
<>
  <div className='flex justify-between items-center bg-white px-4 py-1.5 sticky z-10 top-0'>
      <nav className=" flex w-auto gap-7 text-lg justify-start align-middle items-center ">
        <a href="/Women">Women</a>
        <a href="/Men">Men</a>
        <a href="#">Kids</a>
        <a href="#">Our mission</a>
        <a href="#">Archive</a>
       </nav>

       <div className=" flex align-middle justify-center items-center" >
       <p className="text-3xl font-bold">PANGAIA</p>
       </div>

      <div className='flex gap-4'>
          {/* <button 
          onClick={()=>dispatch(setOpenSidebar(true))}
          className='text-2xl text-gray-500 block md:hidden'>
              ☰
          </button> */}
          <div className=" flex justify-center align-middle items-center gap-5 ">
            <a href="#">Gifts</a>
            <a className="text-blue-500" href="#">Inner Circle</a>
          </div>

          <div className='w-40 2x1:w-[350px] flex items-center py-2 px-2 gap-2 rounded-full bg-[#f3f4f6]'>
              <MdOutlineSearch className='text-black text-xl'/>
              <input type="text"
              placeholder='Search'
              className='flex-auto w-20 outline-none bg-transparent placeholder:text-gray-500' />
          </div>

          <div className="flex gap-6">
            <MdOutlineFlagCircle size={30}/>
            <MdOutlinePerson size={30}/>
            <MdOutlineShoppingBag size={30}/>
          </div>
      </div>

      {/* <div className='flex gap-2 items-center'>
         <NotificationPanel/>

         <UserAvatar/>
      </div> */}
  </div>
  </>
)
}

export default Navbar;

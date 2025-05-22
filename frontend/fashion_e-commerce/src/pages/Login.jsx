import React, { useEffect } from "react";
import {useForm} from "react-hook-form"
import { useNavigate } from "react-router-dom";
import Textbox from "../components/Textbox";
import Button from "../components/Button";
import devX from "../assets/images/devx.jpg";
import { useSelector } from "react-redux";

const Login = () => {
  const {user}= useSelector((state)=> state.auth)
  const{
    register,
    handleSubmit,
    formState: {errors},
  } = useForm();

  const navigate = useNavigate();

  const submitHandler = async(data)=>{
    console.log("submit")
  };
  console.log(user);
  useEffect(()=>{
    user && navigate ("/Landing")
  },[user])

  return <div className="w-full min-h-screen flex items-center justify-center flex-col lg:flex-row bg-[#F5F5F5]">
  
    <div className='w-full md:1/3 p-4 md:p-1 flex flex-col justify-center items-center gap-4'>
          <div className="w-full gap-0.5 flex flex-row justify-center items-center">
            <img src={devX} alt="" className=' p-2 rounded-full w-20'/>
            <p className='flex flex-col gap-0 md:gap-4 text-2xl md:text-5xl 2xl:text-6xl font-black text-center text-black'>
                 Mavrauder Collection
                </p>
              </div>
                <form onSubmit={handleSubmit(submitHandler)}
                className='form-container w-full md:w-[700px] flex flex-col gap-y-6 bg-white px-10 pt-10 pb-14'>
                    <div className=''>
                        <p className='text-black text-3xl font-bold text-start'>Log in</p>
                        <p className="text-base text-gray-400">Enter your email and we'll send you a login code</p>
                    </div>

                    <div className='flex flex-col gap-y-5'> 

                        <Textbox
                        placeholder="Email"
                        type="email"
                        name="email"
                        label=""
                        className="w-full rounded-xl"
                        register={register("email", {
                            required: "Email Address is required!"
                        })}
                        error={errors.email ? errors.email.message : ""}
                        />
                        

                        <span className='text-sm text-gray-500 hover:text-blue-600 hover:underline cursor-pointer'>
                            Privacy
                          </span>

                        {/* {isLoading ? (<Loading/>) :( */}
                            <Button
                            type="submit"
                            label="continue"
                            className="w-full h-10 bg-black text-white rounded-full"

                        />
                       
                    </div>

                </form>
            </div>
  </div>
};

export default Login;
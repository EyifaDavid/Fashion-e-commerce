import clsx from 'clsx'
import React from 'react'
import { useNavigate } from 'react-router-dom';

const Button = ({icon, className, label, type, onClick=()=>{}}) => {
  const navigate = useNavigate();
  
  return (
  <button
  type={type || "button"} className= {clsx("px-3 py-2 outline-none", className)}
  onClick={onClick}>
    <span>{label}</span>
    {icon && icon}
  </button>
  );
}

export default Button
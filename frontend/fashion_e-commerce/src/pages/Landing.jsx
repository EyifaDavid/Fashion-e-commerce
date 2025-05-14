import React from "react";
import { Link } from "react-router-dom";
import hero from "../assets/images/hero.jpg";
import banner1 from "../assets/images/banner1.jpg"
import banner2 from "../assets/images/banner2.jpg"
import banner3 from "../assets/images/banner3.jpg"
import womensPyjama from "../assets/images/pyjama.png"
import kidPyjama from "../assets/images/kid_pyjama.png"
import kidHoodie from "../assets/images/kid_hoodie.png"
import bHoodie from "../assets/images/blue_hoodie.png"
import pHoodie from "../assets/images/pink.png"
import gHoodie from "../assets/images/Green.png"
import Button from "../components/Button";
import ProductSlider from "../components/ProductSlider";


const sampleProducts = [
  { id: 1, name: "Womens 365 Lightweight Short Pyjama", price: "$25", image: womensPyjama , colors: "3"},
  { id: 2, name: "Denim Jacket", price: "$60", image: kidPyjama , colors: "3" },
  { id: 3, name: "Sneakers", price: "$80", image: bHoodie , colors: "3" },
  { id: 4, name: "Jeans", price: "$50", image: pHoodie , colors: "3" },
  { id: 5, name: "Cap", price: "$15", image: kidHoodie , colors: "3"},
  { id: 6, name: "Cap", price: "$15", image: gHoodie , colors: "3"},
]




const Landing = () => {
  return <div className="p-6 w-full mx-auto">
  <div className="relative w-full h-250 flex">
    <img src={hero} className="w-full h-full object-cover rounded-md" />
  <div className=" absolute inset-0 flex flex-col items-center justify-center -bottom-80">
   <div className="max-w-2xl text-center">
   <h1 className="mt-4 text-6xl ">The Gift Guide</h1>
      <p className="mt-2 mb-6 text-sm">Gifts that mean more, for those who mean the most</p>
    <div className="flex flex-row gap-10 w-full justify-center items-center">
    <Button
    type="submit"
    label="Shop for her"
    className="w-full h-15 p-5 bg-blue-700 text-white rounded-full"
    />
    <Button
    type="submit"
    label="Shop for him"
    className="w-full h-15 p-5 bg-blue-700 text-white rounded-full"
    />
    </div>
   </div>
        </div>
        </div>

      <div className="flex w-full mx-auto">
        <div className="relative w-full">
        <img src={banner1} className="flex-1 w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center -bottom-100">
            <p className="text-white font-bold text-lg p-5">Recycled Cashmere</p>
            <Button
            type="submit"
            label="Shop womens"
            className="text-black bg-white rounded-full "/>
          </div>
        </div>
        <div className="relative w-full">
        <img src={banner2} className="flex-1 w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center -bottom-100">
          <p className="text-white font-bold text-lg p-5">Coats & Jackets</p>
            <Button
            type="submit"
            label="Shop mens"
            className="text-black bg-white rounded-full "/>
          </div>
        </div>
        <div className="relative w-full">
        <img src={banner3} className="flex-1 w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center -bottom-100">
          <p className="text-white font-bold text-lg p-5">Organic Cotton hoodie</p>
            <Button
            type="submit"
            label="Shop now"
            className="text-black bg-white rounded-full "/>
          </div>
        </div>
      </div>

       <div className="p-6">
      <ProductSlider title=" Most Loved gifts" products={sampleProducts} />
    </div>
 
</div>
};

export default Landing;

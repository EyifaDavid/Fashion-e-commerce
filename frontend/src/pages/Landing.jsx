import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
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
import display1 from "../assets/images/display1.jpg"
import display2 from "../assets/images/display2.jpg"
import display3 from "../assets/images/display3.jpg"
import display4 from "../assets/images/display4.jpg"
import male1 from "../assets/images/male1.jpg"
import male2 from "../assets/images/male2.jpg"
import female1 from "../assets/images/female1.jpg"
import female2 from "../assets/images/female2.jpg"
import twos from "../assets/images/two4one.jpg";
import ProductSlider from "../components/ProductSlider";
import SimilarProducts from "../components/SimilarProducts";
import Inspo from "../components/inspo";
import DisplaySlider from "../components/DisplaySlider";
import Footer from "../components/Footer";


const sampleProducts = [
  { id: 1, name: "Womens 365 Lightweight Short Pyjama", price: 25, image: womensPyjama , noColors: "3", colors: ['#000000', '#ffffff', '#be123c'], countInStock: 5,},
  { id: 2, name: "Denim Jacket", price: 25, image: kidPyjama ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'],countInStock: 5, },
  { id: 3, name: "Sneakers", price: 80, image: bHoodie ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'] ,countInStock: 5,},
  { id: 4, name: "Jeans", price: 50, image: pHoodie ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'],countInStock: 5, },
  { id: 5, name: "Cap", price: 15, image: kidHoodie ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'],countInStock: 5,},
  { id: 6, name: "Cap", price: 15, image: gHoodie ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'],countInStock: 5,},
];

const adSamples = [
  {
    title: "Get 20% off!",
    description: "Use code SUMMER20 on your next order.",
    image: "/ads/sale.jpg",
  },
  {
    title: "Free Shipping",
    description: "On all orders over $50 this week only.",
  },
  {
    title: "New Arrivals",
    description: "Shop our latest drops.",
    image: "/ads/new.jpg",
  },
];

const inspoSample = [
  { id: 1, name: "male1", image: male1 },
  { id: 2, name: "female1", image: male2 },
  { id: 3, name: "male2", image: female1 },
  { id: 4, name: "female2", image: female2 },
];

const displaySamples = [
  { id: 1, name: "dispay1", image: display1, description:"A radically minimal tote crafted entirely from MIRIUM@ a 100% bio-based, animal-free leather alternative" },
  { id: 2, name: "display2", image: display2 },
  { id: 3, name: "display3", image: display3 },
  { id: 4, name: "display4", image: display4 },
];


const Landing = () => {
  return <div className="md:p-6 p-4 w-full mx-auto">
    {/*Hero Section */}
  <div className="relative h-150 w-full md:h-250 flex">
    <img src={hero} className="w-full h-full object-cover rounded-md" />
  <div className=" absolute inset-0 flex flex-col items-center justify-center -bottom-80">
   <div className="max-w-2xl text-center">
   <h1 className="mt-4 text-6xl ">The Gift Guide</h1>
      <p className="mt-2 mb-6 text-sm">Gifts that mean more, for those who mean the most</p>
    <div className="flex flex-row gap-10 w-full justify-center items-center">

   <Link to="/shop/women">
    <Button
    type="submit"
    label="Shop for her"
    className="w-[148px] h-[48px] p-5 bg-[#002fa7] text-white rounded-full"
    />
   </Link>
   
   

     <Link to="/shop/men">
    <Button
    type="submit"
    label="Shop for him"
    className="w-[148px] h-[48px] p-5 bg-[#002fa7] text-white rounded-full"
    />
   </Link>
    </div>
   </div>
        </div>
        </div>
     {/*Catalogue Section 1 */}
      <div className="flex flex-col md:flex-row w-full mx-auto">
        <div className="relative w-full">
        <img src={banner1} className="flex-1 w-full h-full object-cover" />
          <div className=" absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center">
            <div className="min-w-5xl text-center">
             <p className="text-white font-bold text-lg pb-3">Recycled Cashmere</p>
            <Link to="/shop/women">
            <Button
            type="submit"
            label="Shop womens"
            className="text-black bg-white rounded-full w-[148px] h-[48px]"/>
           </Link>
            </div>
          </div>
        </div>
        <div className="relative w-full">
        <img src={banner2} className="flex-1 w-full h-full object-cover" />
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center ">
          <p className="text-white font-bold text-lg pb-3 ">Coats & Jackets</p>
          <Link to="/shop/men">
            <Button
            type="submit"
            label="Shop mens"
            className="text-black bg-white rounded-full w-[148px] h-[48px]"/>
            </Link>
          </div>
        </div>
        <div className="relative w-full">
        <img src={banner3} className="flex-1 w-full h-full object-cover" />
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center ">
          <p className="text-white font-bold text-lg p-3">Organic Cotton hoodie</p>
          <Link to="/shop/all">
            <Button
            type="submit"
            label="Shop now"
            className="text-black bg-white rounded-full w-[148px] h-[48px]"/>
            </Link>
          </div>
        </div>
      </div>
    {/*Product Slider Section */}
       <div className="p-6">
      <ProductSlider title=" Most Loved gifts" products={sampleProducts} />
    </div>
    {/*Best-Offer Section  */}
      <SimilarProducts products={sampleProducts} ads={adSamples} />
    {/*Inspiration Section  */}
    <div>
      <Inspo inspos={inspoSample}/>
    </div>
    {/*On-display Section  */}
    <div>
    <DisplaySlider displays={displaySamples} />
    </div>
     {/*Footer Section  */}

</div>
};

export default Landing;

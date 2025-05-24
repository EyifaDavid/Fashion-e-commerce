import React from "react";
import clsx from "clsx";
import { Chart } from "../../components/Chart";
import Loading from "../../components/Loader";
import womensPyjama from "../../assets/images/pyjama.png"
import kidHoodie from "../../assets/images/kid_hoodie.png"
import bHoodie from "../../assets/images/blue_hoodie.png"
import pHoodie from "../../assets/images/pink.png"
import gHoodie from "../../assets/images/Green.png"
import { FaBoxOpen, FaMoneyBill, FaUser, FaUsers } from "react-icons/fa";
import { IoCart } from "react-icons/io5";


const Dashboard = () => {
  const data = {
    totalRevenue: 18400,
    shop: {
      orders: 350,
      products: 128,
      users: 78,
    },
    graphData: [
      { label: "2024-05-01", value: 500 },
      { label: "2024-05-02", value: 850 },
      { label: "2024-05-03", value: 1200 },
      { label: "2024-05-04", value: 950 },
      { label: "2024-05-05", value: 1300 },
      { label: "2024-05-06", value: 1100 },
      { label: "2024-05-07", value: 1400 },
    ],
    topSelling: [
      { id: 1, name: "Sneakers", sold: 120, price: "$2,400", image:womensPyjama },
      { id: 2, name: "T-Shirts", sold: 95, price: "$1,425",image:bHoodie },
      { id: 3, name: "Jeans", sold: 80, price: "$2,000",image:gHoodie },
      { id: 4, name: "Jeans", sold: 80, price: "$2,000",image:pHoodie },
      { id: 5, name: "Jeans", sold: 80, price: "$2,000",image:kidHoodie },
    ],
    users: [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
      { id: 3, name: "Alice Johnson", email: "alice@example.com" },
    ],
  };

  const isLoading = false;
  if (isLoading)
    return (
      <div className="py-10"> 
        <Loading/>
      </div>
    );

  const totals = data?.shop;

  const stats = [
    {
      _id: "1",
      label: "Total Revenue",
      total:  data?.totalRevenue || 0,
      icon: <FaMoneyBill />,
      bg: "bg-[#1d4ed8]",
    },
    {
      _id: "2",
      label: "Total Orders/Sales",
      total: totals["orders"] || 0,
      icon: <IoCart />,
      bg: "bg-[#0f766e]",
    },
    {
      _id: "3",
      label: "Total Products ",
      total: totals["products"] || 0,
      icon: <FaBoxOpen />,
      bg: "bg-[#f59e0b]",
    },
    {
      _id: "4",
      label: "Total Users",
      total: totals["users"] || 0,
      icon: <FaUsers />,
      bg: "bg-[#be185d]" ,
    },
  ];

  const Card = ({ label, count, bg, icon }) => {
    return (
      <div className='w-full h-32 bg-white p-5 shadow-md rounded-md flex items-center justify-between'>
        <div className='h-full flex flex-1 flex-col justify-between'>
          <p className='text-base text-gray-600'>{label}</p>
          <span className='text-2xl font-semibold'>{count}</span>
          <span className='text-sm text-gray-400'>{"last month"}</span>
        </div>

        <div
          className={clsx(
            "w-10 h-10 rounded-full flex items-center justify-center text-white",
            bg
          )}
        >
          {icon}
        </div>
      </div>
    );
  };

const TopSellingSlider = ({ products }) => (
  <div className="w-full bg-white p-4 rounded shadow-sm">
    <h4 className="text-lg font-semibold text-gray-600 mb-4">Top Selling Products</h4>
    <div className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
      {products.map(product => (
        <div key={product.id} className="min-w-[200px] bg-gray-50 p-4 border rounded shadow flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-24 h-24 object-cover mx-auto rounded"
          />
          <div className="text-center mt-2">
            <p className="font-semibold">{product.name}</p>
            <p className="font-semibold">{product.price}</p>
            <p className="text-sm text-gray-500">{product.sold} sold</p>
          </div>
        </div>
      ))}
    </div>
  </div>
  );

  return (
    <div className='h-full py-4 '>
      <div className="mb-2 p-2">
        <h1 className="text-2xl text-white font-bold">Dashboard</h1>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-5'>
        {stats.map(({ icon, bg, label, total }, index) => (
          <Card key={index} icon={icon} bg={bg} label={label} count={total} />
        ))}
      </div>

      <div className='w-full bg-white my-16 p-4 rounded shadow-sm'>
        <h4 className='text-xl text-gray-600 font-semibold'>
          Sales Analytics
        </h4>
        <Chart data={data?.graphData} />
      </div>

      <div className='w-full flex flex-col md:flex-row gap-4 2xl:gap-10 py-8'>
        {/* /left */}

        <TopSellingSlider products={data?.topSelling} />

        {/* /right */}

      </div>
    </div>
  );
};

export default Dashboard;

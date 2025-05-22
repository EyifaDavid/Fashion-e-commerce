import React from "react";
import clsx from "clsx";
import { Chart } from "../../components/Chart";
import Loading from "../../components/Loader";
import { FaBoxOpen, FaMoneyBill, FaUser } from "react-icons/fa";
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
      { id: 1, name: "Sneakers", sold: 120, revenue: "$2,400" },
      { id: 2, name: "T-Shirts", sold: 95, revenue: "$1,425" },
      { id: 3, name: "Jeans", sold: 80, revenue: "$2,000" },
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
      total: data?.totalRevenue || 0,
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
      icon: <FaUser />,
      bg: "bg-[#be185d]" ,
    },
  ];

  const Card = ({ label, count, bg, icon }) => {
    return (
      <div className='w-full h-32 bg-white p-5 shadow-md rounded-md flex items-center justify-between'>
        <div className='h-full flex flex-1 flex-col justify-between'>
          <p className='text-base text-gray-600'>{label}</p>
          <span className='text-2xl font-semibold'>{count}</span>
          <span className='text-sm text-gray-400'>{"110 last month"}</span>
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

    const TopSellingTable = ({ products }) => (
    <div className='w-full bg-white p-4 rounded shadow-sm'>
      <h4 className='text-lg font-semibold text-gray-600 mb-4'>Top Selling Products</h4>
      <table className='w-full text-left border-collapse'>
        <thead>
          <tr>
            <th className='py-2 px-4 border-b'>Product</th>
            <th className='py-2 px-4 border-b'>Units Sold</th>
            <th className='py-2 px-4 border-b'>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td className='py-2 px-4 border-b'>{product.name}</td>
              <td className='py-2 px-4 border-b'>{product.sold}</td>
              <td className='py-2 px-4 border-b'>{product.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className='h-full py-4 '>
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

        <TopSellingTable products={data?.topSelling} />

        {/* /right */}

      </div>
    </div>
  );
};

export default Dashboard;

import {
  Navigate,
  Outlet,
  replace,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Landing from "./pages/landing";
import Login from "./pages/Login";
import { Toaster } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./components/Navbar";
import ProductList from "./pages/ProductList";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Catalogue from "./pages/catalogue";
import About from "./pages/about";
import Footer from "./components/Footer";
import Men from "./pages/Men";
import Women from "./pages/women";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/AdminProducts";
import AdminRoute from "./routes/AdminRoute";
import Dashboard from "./pages/admin/Dashboard";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminUsers from "./pages/admin/AdminUsers";
import { fetchCart } from "./redux/slices/cartSlice";
import { useEffect } from "react";
import CategoryPage from "./pages/Category";

function Layout() {
  const {user}= useSelector((state)=> state.auth)

  const location = useLocation();

  return user ? (
    <div className="w-full min-h-screen flex flex-col md:flex-row ">
      <div className="flex-1 overflow-y-auto">
        {<Navbar/>}

        <div className="flex-grow overflow-y-auto md:p-4 2xl:px-10 overflow-x-hidden ">
          {<Outlet/>}
        </div>
        <div>
          <Footer />
        </div>
      </div>
    </div>
  ) : (
    <Navigate to="/log-in" state={{ from: location }} replace />
  );
}

function App() {
 const dispatch = useDispatch();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    dispatch(fetchCart());
  }
  }, [dispatch]);
  return (
    <main className="w-full min-h-screen bg-white">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/Landing" />} />
          <Route path="/Landing" element={<Landing />} />
          <Route path="/ProductList" element={<ProductList />} />
          <Route path="/Cart" element={<Cart />} />
          <Route path="/Checkout" element={<Checkout />} />
          <Route path="/product/:id" element={<Catalogue />} />
          <Route path="/About" element={<About />} />
          <Route path="/shop" element={<CategoryPage />} />
          <Route path="/shop/:category" element={<CategoryPage />} />
        </Route>
        {/* <Route path="/admin/*" element={user?.isAdmin ? <AdminDashboard /> : <Navigate to="/" />} /> */}
        <Route path="/log-in" element={<Login />} />

      <Route path="/admin" element={<AdminRoute />}>
       <Route element={<AdminDashboard />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<ProductManagement />} />

      </Route>
     </Route>

     <Route path="/admin/product/:id" element={<ProductManagement />} />




      </Routes>

      <Toaster richColors />
    </main>
    
  );
}

export default App;

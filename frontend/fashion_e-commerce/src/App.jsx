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
import { useSelector } from "react-redux";
import Navbar from "./components/Navbar";
import ProductList from "./pages/ProductList";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Catalogue from "./pages/catalogue";
import About from "./pages/about";
import Footer from "./components/Footer";
import Men from "./pages/Men";
import Women from "./pages/women";

function Layout() {
  const {user}= useSelector((state)=> state.auth)

  const location = useLocation();

  return user ? (
    <div className="w-full h-screen flex flex-col md:flex-row">
      <div className="flex-1 overflow-y-auto">
        {<Navbar/>}

        <div className="flex-grow overflow-y-auto p-4 2xl:px-10">
          {<Outlet/>}
        </div>
            <Footer />
      </div>
    </div>
  ) : (
    <Navigate to="/log-in" state={{ from: location }} replace />
  );
}

function App() {
  return (
    <main className="w-full min-h-screen bg-white">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/Landing" />} />
          <Route path="/Landing" element={<Landing />} />
          <Route path="/ProductList" element={<ProductList />} />
          <Route path="/Cart" element={<Cart />} />
          <Route path="/Checkout" element={<Checkout />} />
          <Route path="/Catalogue" element={<Catalogue />} />
          <Route path="/About" element={<About />} />
          <Route path="/Men" element={<Men />} />
          <Route path="/Women" element={<Women />} />
        </Route>
        <Route path="/log-in" element={<Login />} />
        <Route path="/product/:id" element={<Catalogue />} />
      </Routes>

      <Toaster richColors />
    </main>
    
  );
}

export default App;

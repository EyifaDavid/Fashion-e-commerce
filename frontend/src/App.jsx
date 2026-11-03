import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import { Toaster } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./components/Navbar";
import ProductList from "./pages/ProductList";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Catalogue from "./pages/Catalogue";
import About from "./pages/About";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/AdminProducts";
import AdminRoute from "./routes/AdminRoute";
import Dashboard from "./pages/admin/Dashboard";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminUsers from "./pages/admin/AdminUsers";
import { fetchCart } from "./redux/slices/cartSlice";
import { useEffect } from "react";
import CategoryPage from "./pages/Category";
import MannequinLab from "./pages/MannequinLab";
import Wardrobe from "./pages/Wardrobe";
import WardrobePrototype from "./prototypes/wardrobe/WardrobePrototype";
import Rack from "./pages/Rack";
// [NORTH] Campaign and route styles remain scoped away from the rack.
import PageTransition from "./components/north/PageTransition";
import "./styles/north.css";
// [NORTH] Shared Adinkra background treatment for every route.
import "./styles/adinkra.css";
// [NORTH] Use the supplied Fonarto family for headings and wordmarks.
import "./styles/typography.css";

function Layout() {
  const {user}= useSelector((state)=> state.auth)

  const location = useLocation();
  const isLanding = location.pathname === "/" || location.pathname.toLowerCase() === "/landing";
  const fullBleed = isLanding || location.pathname.startsWith("/product/");

  return user ? (
    // [NORTH] Keep short pages and loading states above a footer anchored at the bottom.
    <div className="north-shop-layout w-full flex flex-col">
        {!isLanding && <Navbar />}

        <div className={"north-shop-content " + (fullBleed ? "" : "md:p-4 2xl:px-10")}>
          {<Outlet/>}
        </div>
        <Footer />
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
    <main className="site-adinkra w-full min-h-screen bg-white">
      <PageTransition>
      {/* [NORTH] Render the next location only after the block overlay covers it. */}
      {(displayedLocation) => (
      <Routes location={displayedLocation}>
        <Route element={<Layout />}>
          {/* [NORTH] Serve the home alias directly so a redirect cannot interrupt coverage. */}
          <Route path="/" element={<Landing />} />
          <Route path="/Landing" element={<Landing />} />
          <Route path="/ProductList" element={<ProductList />} />
          <Route path="/Cart" element={<Cart />} />
          <Route path="/Checkout" element={<Checkout />} />
          <Route path="/product/:id" element={<Catalogue />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/About" element={<About />} />
          <Route path="/shop" element={<CategoryPage />} />
          <Route path="/shop/:category" element={<CategoryPage />} />
        </Route>
        {/* <Route path="/admin/*" element={user?.isAdmin ? <AdminDashboard /> : <Navigate to="/" />} /> */}
        <Route path="/log-in" element={<Login />} />

        {/* Dev/test route for the 3D mannequin — no auth, isolated from product pages. */}
        <Route path="/mannequin-lab" element={<MannequinLab />} />

        {/* Prototype surface: interactive clothing-rack directions. Not linked in the app. */}
        <Route path="/prototypes/wardrobe" element={<WardrobePrototype />} />

        {/* [RACK] Restore the original standalone rack surface. */}
        <Route path="/rack" element={<Rack />} />

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
      )}
      </PageTransition>

      <Toaster richColors />
    </main>
    
  );
}

export default App;

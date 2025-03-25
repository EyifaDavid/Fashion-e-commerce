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

function Layout() {
  const user = "";

  const location = useLocation();

  return user ? (
    <div className="w-full h-screen flex flex-col md:flex-row">
      <div className="flex-1 overflow-y-auto">
        {/* {<Navbar/>} */}

        <div className="p-4 2xl:px-10">
          {<Outlet/>}
        </div>
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
        </Route>
        <Route path="/log-in" element={<Login />} />
      </Routes>

      <Toaster richColors />
    </main>
  );
}

export default App;

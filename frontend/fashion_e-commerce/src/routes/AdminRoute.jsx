import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const { user } = useSelector((state) => state.auth);

  return user?.isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;

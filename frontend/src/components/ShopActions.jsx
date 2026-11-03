// [NORTH] One aligned set of account controls for the hero and shop header.
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { MdAdminPanelSettings, MdOutlineShoppingBag } from "react-icons/md";
import UserAvatar from "./UserAvatar";

export default function ShopActions() {
  const user = useSelector((state) => state.auth.user);
  const count = useSelector((state) => state.cart.cartItems.length);
  return (
    <div className="north-header-actions" role="group" aria-label="Account and shopping bag">
      {user?.isAdmin && <Link to="/admin" className="north-icon-control" aria-label="Admin dashboard"
        title="Admin dashboard" data-north-header-action="admin"><MdAdminPanelSettings size={22} aria-hidden="true" /></Link>}
      <Link to="/Cart" className="north-icon-control" aria-label={"Shopping bag, " + count + " items"}
        title="Shopping bag" data-north-header-action="bag">
        <MdOutlineShoppingBag size={22} aria-hidden="true" />
        {count > 0 && <span className="north-bag-count" aria-hidden="true">{count}</span>}
      </Link>
      <UserAvatar />
    </div>
  );
}

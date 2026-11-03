// [NORTH] Responsive shop navigation shares the hero's aligned icon controls.
import { useState } from "react";
import { Link } from "react-router-dom";
import { MdOutlineSearch } from "react-icons/md";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import ShopActions from "./ShopActions";

const links = [["/", "Home"], ["/shop/women", "Women"], ["/shop/men", "Men"], ["/wardrobe", "Wardrobe"]];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="north-shop-nav">
      <div className="north-shop-nav-row">
        <button type="button" className="north-icon-control north-shop-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="north-mobile-nav">
          {menuOpen ? <HiX size={22} aria-hidden="true" /> : <HiOutlineMenuAlt3 size={22} aria-hidden="true" />}
        </button>
        <nav className="north-shop-links" aria-label="Main navigation">
          {links.map(([href, label]) => <Link key={href} to={href}>{label}</Link>)}
        </nav>
        <Link to="/" className="north-shop-brand" aria-label="Ubiquitous home">
          <img src="/ubiquitous-logo.png" alt="" width="32" height="32" />
          <span className="brand-wordmark">UBIQUITOUS</span>
        </Link>
        <div className="north-shop-tools">
          <label className="north-shop-search"><MdOutlineSearch size={20} aria-hidden="true" />
            <span className="sr-only">Search products</span><input type="search" placeholder="Search" /></label>
          <ShopActions />
        </div>
      </div>
      {menuOpen && <nav id="north-mobile-nav" className="north-mobile-nav" aria-label="Mobile navigation">
        {links.map(([href, label]) => <Link key={href} to={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
      </nav>}
    </header>
  );
}

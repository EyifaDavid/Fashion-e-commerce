// [NORTH] Campaign homepage: retain the existing collections, offers, and photography.
import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import NorthHero from "../components/north/NorthHero";
import NorthImage from "../components/north/NorthImage";
import RevealGrid from "../components/RevealGrid";
import useScrollReveal from "../hooks/useScrollReveal";
// [NORTH] Reuse the restored rack directly before the featured catalogue grid.
import Rack from "./Rack";
import { formatMoney } from "../utils/money";
import { useGetProductsQuery } from "../redux/slices/api/productApiSlice";
import banner1 from "../assets/images/banner1.jpg";
import banner2 from "../assets/images/banner2.jpg";
import banner3 from "../assets/images/banner3.jpg";
import display1 from "../assets/images/display1.jpg";
import display2 from "../assets/images/display2.jpg";
import display3 from "../assets/images/display3.jpg";
import display4 from "../assets/images/display4.jpg";
import male1 from "../assets/images/male1.jpg";
import male2 from "../assets/images/male2.jpg";
import female1 from "../assets/images/female1.jpg";
import female2 from "../assets/images/female2.jpg";
import twos from "../assets/images/two4one.jpg";

const collections = [
  { title: "Recycled Cashmere", image: banner1, href: "/shop/women", label: "Shop womens" },
  { title: "Coats & Jackets", image: banner2, href: "/shop/men", label: "Shop mens" },
  { title: "Organic Cotton hoodie", image: banner3, href: "/shop/all", label: "Shop now" },
];
const inspiration = [
  { image: male1, href: "/shop/men", label: "Explore men's style" },
  { image: male2, href: "/shop/men", label: "Explore men's essentials" },
  { image: female1, href: "/shop/women", label: "Explore women's style" },
  { image: female2, href: "/shop/women", label: "Explore women's essentials" },
];
const displays = [display1, display2, display3, display4];

export default function Landing() {
  const root = useRef(null);
  useScrollReveal(root);
  const { data, isLoading, error, refetch } = useGetProductsQuery();
  const products = useMemo(() => (data?.data || []).filter((product) => !product.isTrashed), [data]);
  const featured = useMemo(() => {
    const chosen = products.filter((product) => product.isFeatured);
    return (chosen.length ? chosen : products).slice(0, 4);
  }, [products]);
  const recommended = useMemo(() => {
    const discounted = products.filter((product) => product.discount || product.specialOffer);
    return (discounted.length ? discounted : products).slice(0, 8);
  }, [products]);

  return (
    <div className="north-page" ref={root} data-north-scroll-scope>
      <NorthHero />
      <section className="north-collections" id="north-collections" aria-label="Shop collections">
        {collections.map((collection) => (
          <Link key={collection.title} to={collection.href} className="north-collection" data-north-scroll>
            <NorthImage src={collection.image} alt={collection.title} aspect="3 / 4" />
            <div className="north-collection-copy"><h2>{collection.title}</h2><span>{collection.label}</span></div>
          </Link>
        ))}
      </section>
      <Rack embedded />
      <RevealGrid id="north-featured" title="Most Loved gifts" products={featured} isLoading={isLoading} error={error} onRetry={refetch} />
      <section className="north-offer" aria-labelledby="north-offer-title">
        <NorthImage src={twos} alt="Two for one hoodie set" aspect="1 / 1" />
        <div className="north-offer-copy" data-north-scroll>
          <h2 id="north-offer-title">Buy two for the price of one.</h2>
          <p>Choose your set across selected Heavyweight colours and enjoy your two items for the price of one.
            Treat yourself to the cosiest holiday outfit or give someone you love an unforgettable gift.</p>
          <Link to="/shop/discounts" className="north-solid-link">See eligible colors</Link>
        </div>
      </section>
      <RevealGrid id="north-recommended" title="You may also like" products={recommended} isLoading={isLoading} error={error} onRetry={refetch} />
      <section className="north-promotions" aria-label="Current offers">
        <Link to="/shop/discounts" className="north-discount-banner"><h3>Get 20% off!</h3><p>Use code SUMMER20 on your next order.</p></Link>
        <Link to="/shop"><h3>Free Shipping</h3><p>On all orders over {formatMoney(50)} this week only.</p></Link>
        <Link to="/shop"><h3>New Arrivals</h3><p>Shop our latest drops.</p></Link>
      </section>
      <section className="north-section" aria-labelledby="north-inspiration-title">
        <div className="north-section-heading" data-north-scroll><h2 id="north-inspiration-title">Inspiration</h2><Link to="/shop">View more</Link></div>
        <p className="north-section-description">Explore how our community styles our trending pieces.</p>
        <div className="north-editorial-grid">
          {inspiration.map((photo) => <Link key={photo.image} to={photo.href} aria-label={photo.label} data-north-scroll>
            <NorthImage src={photo.image} alt={photo.label} aspect="3 / 4" />
          </Link>)}
        </div>
      </section>
      <section className="north-section north-stories" aria-labelledby="north-story-title">
        <div className="north-section-heading" data-north-scroll><h2 id="north-story-title">On display</h2><Link to="/About">Find Out More</Link></div>
        <div className="north-display-grid">
          {displays.map((image, index) => <Link key={image} to="/About" aria-label={"Explore our collection story " + (index + 1)} data-north-scroll>
            <NorthImage src={image} alt={"Ubiquitous collection detail " + (index + 1)} aspect="4 / 3" />
          </Link>)}
        </div>
        <p className="north-story-caption">A radically minimal tote crafted entirely from MIRIUM,
          a 100% bio-based, animal-free leather alternative.</p>
      </section>
    </div>
  );
}

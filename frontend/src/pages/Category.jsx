import { useParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { MdArrowOutward, MdOutlineShoppingBag } from "react-icons/md";
import CollectionFilters from "../components/CollectionFilters";
import useScrollReveal from "../hooks/useScrollReveal";
// [NORTH] Match the product and wardrobe loading experience.
import Loading from "../components/Loader";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/slices/cartSlice";
// [NORTH] Display catalogue amounts in Ghana cedis.
import { formatMoney } from "../utils/money";
import { colourName } from "../utils/colour";

export default function CategoryPage() {
  const { category } = useParams(); // "men", "women", "shop"
  const [products, setProducts] = useState([]);
  const root = useRef(null);
  useScrollReveal(root, products);
  const [loading, setLoading] = useState(true);
  const [subCategory, setSubCategory] = useState("All");
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);


  const subCategories = ["All", "clothing", "footwear", "accessories"];

  const handleAddToCart = (product) => {
      const item = {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0],
        countInStock: product.stock,
      };

      const isInCart = cartItems.find((i) => i.id === item.id);

      if (item.countInStock === 0) {
        toast.error("Product is out of stock");
        return;
      }

      if (isInCart && isInCart.quantity >= item.countInStock) {
        toast.error("Not enough stock available");
        return;
      }

      dispatch(addToCart({productId: item.id, quantity:1}));
      toast.success("Added to cart");
    };


  useEffect(() => {
    const API = import.meta.env.VITE_API_BASE_URL;
    let url = `${API}/products`;

     const params = new URLSearchParams();

    if (category === "discounts") {
      params.append("discount", "true");
  } else if (category && category !== "shop" && category !== "undefined") {
    params.append("gender", category);
  }

  if ([...params].length > 0) {
    url += `?${params.toString()}`;
  }

  console.log("Final Fetch URL:", url); // Debug helper

    const fetchProducts = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.status) {
          setProducts(data.data);
        } else {
          console.error("Error fetching products:", data.message);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const filteredProducts =
    subCategory === "All"
      ? products
      : products.filter((p) => p.category?.toLowerCase() === subCategory);

  if (loading) return <Loading page label="Loading collection…" />;

  const counts = Object.fromEntries(subCategories.map((option) => [option, option === "All" ? products.length : products.filter((product) => product.category?.toLowerCase() === option).length]));
  const title = category === "discounts" ? "Selected offers" : category ? category[0].toUpperCase() + category.slice(1) + " collection" : "The collection";

  return (
    <div className="north-page north-collection-page" ref={root} data-north-scroll-scope>
      <h1>{title}</h1>
      <CollectionFilters options={subCategories} value={subCategory} onChange={setSubCategory}
        counts={counts} total={filteredProducts.length} />
      {filteredProducts.length === 0 ? <p className="north-grid-status">No products available.</p> : (
        <div className="north-catalogue-grid">
          {filteredProducts.map((item) => (
            <article key={item._id} className="north-catalogue-card" data-north-scroll>
              <Link to={"/product/" + item._id} state={{ product: item }} className="north-catalogue-link">
                <img src={item.images?.[0] || "/placeholder.jpg"} alt={item.name}
                  className="north-catalogue-media" width="640" height="800" loading="lazy" />
                <span className="north-product-peek" aria-hidden="true"><span>View piece</span><MdArrowOutward size={18} /></span>
              </Link>
              <div className="north-product-copy">
                <div><Link to={"/product/" + item._id}><h3>{item.name}</h3></Link><p>{formatMoney(item.price)}</p></div>
                <button type="button" className="north-quick-add" onClick={() => handleAddToCart(item)}
                  aria-label={"Add " + item.name + " to cart"} title="Add to cart" disabled={item.stock === 0}>
                  <MdOutlineShoppingBag size={22} aria-hidden="true" />
                </button>
              </div>
              <div className="north-colour-dots" role="group" aria-label={item.name + " colours"}>
                {item.colors?.slice(0,4).map((color) => <Link key={color} to={"/product/" + item._id}
                  state={{selectedColor:color}} className="north-card-swatch" title={colourName(color)}
                  aria-label={"View " + item.name + " in " + colourName(color)}>
                  <span aria-hidden="true" style={{backgroundColor:color}} />
                </Link>)}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

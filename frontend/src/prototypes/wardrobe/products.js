// [RACK] Static rail inventory. Every piece ships with pre-cut artwork that
// already includes its hanger, so each item only needs its three views.
// All artwork is 640x800 with the hook tip at row 8, so GarmentRack seats every
// hook on the rail with one shared offset - never lift a piece, or its hook
// floats above the rail.
// [RACK] `drop` is an optional downward nudge (px) for artwork whose hook head
// is drawn flatter/wider than the rest, which makes it read as sitting high.
// [NORTH] The restored rail and its panel display Ghana cedis too.
import { formatMoney } from "../../utils/money";
const garment = (slug, name, price, colors, category, sizes, drop = 0) => ({
  id: slug,
  name,
  price,
  front: `/rack-garments/${slug}-front.png`,
  side: `/rack-garments/${slug}-side.png`,
  back: `/rack-garments/${slug}-back.png`,
  colors,
  category,
  tag: "",
  sizes,
  drop,
});

const TOP_SIZES = ["XS", "S", "M", "L", "XL"];
const JACKET_SIZES = ["S", "M", "L", "XL"];

export const rackProducts = [
  garment("black-bomber", "Black Bomber", 120, ["#0b0b0b"], "Outerwear", JACKET_SIZES),
  garment("navy-bomber", "Navy Bomber", 120, ["#1e293b"], "Outerwear", JACKET_SIZES),
  garment("denim-jacket", "Denim Jacket", 110, ["#4a6fa5"], "Outerwear", JACKET_SIZES),
  garment("varsity-jacket", "Varsity Jacket", 130, ["#b91c1c"], "Outerwear", JACKET_SIZES),
  garment("blue-hoodie", "Blue Hoodie", 75, ["#2563eb"], "Hoodies", TOP_SIZES),
  garment("navy-hoodie", "Navy Hoodie", 75, ["#1e293b"], "Hoodies", TOP_SIZES),
  garment("yellow-hoodie", "Yellow Hoodie", 75, ["#facc15"], "Hoodies", TOP_SIZES),
  garment("green-shirt", "Green Shirt", 55, ["#3f6b4f"], "Shirts", TOP_SIZES),
  garment("blue-polo", "Blue Polo", 45, ["#2563eb"], "Polos", TOP_SIZES, 3),
  garment("cream-polo", "Cream Polo", 45, ["#f2e8d5"], "Polos", TOP_SIZES),
  garment("grey-polo", "Grey Polo", 45, ["#9ca3af"], "Polos", TOP_SIZES, 3),
  garment("blue-tee", "Blue Tee", 30, ["#2563eb"], "T-Shirts", TOP_SIZES),
  garment("white-tee", "White Tee", 30, ["#f5f5f5"], "T-Shirts", TOP_SIZES),
];

export const priceFmt = formatMoney;

// [NORTH] Friendly labels for the shop palette; custom colours retain their exact value.
const names = {
  "#000000": "Black", "#ffffff": "White", "#bbbdbc": "Grey",
  "#be123c": "Red", "#2563eb": "Blue", "#22c55e": "Green",
  "#facc15": "Yellow", "#d946ef": "Pink", "#7c3aed": "Purple",
  "#f97316": "Orange", "#e9cdd2": "Pink", "#353334": "Charcoal", "#bec5cd": "Grey",
};
export const colourName = (colour = "") => names[colour.toLowerCase()] || colour;

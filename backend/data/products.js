

const products =[
    {
      id: 1,
      name: "Blue Hoodie",
      price: 30,
      stock: 10,
      images: [bHoodie],
      category: "Hoodies",
      genders: ["Male", "Female"],
      sizes: ["S", "M", "L"],
      noColors: "3",
      colors: ["#000000", "#ffffff", "#be123c"],
    },
    {
      id: 2,
      name: "Women’s Pyjama",
      price: 25,
      stock: 8,
      images: [womensPyjama],
      category: "Pyjamas",
      genders: ["Female"],
      sizes: ["S", "M"],
      noColors: "3",
      colors: ["#000000", "#ffffff", "#be123c"],
    },
    {
      id: 3,
      name: "Kids Pyjama",
      price: 20,
      stock: 15,
      images: [kidPyjama],
      category: "Pyjamas",
      genders: ["Male", "Female"],
      sizes: ["XS", "S"],
      noColors: "3",
      colors: ["#000000", "#ffffff", "#be123c"],
    },
];

module.exports = products;
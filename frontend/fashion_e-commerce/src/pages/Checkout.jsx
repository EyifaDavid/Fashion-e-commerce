export default function Checkout() {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <input type="text" placeholder="Full Name" className="w-full border p-2 mb-4 rounded" />
        <input type="text" placeholder="Shipping Address" className="w-full border p-2 mb-4 rounded" />
        <input type="text" placeholder="Card Number" className="w-full border p-2 mb-4 rounded" />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Place Order
        </button>
      </div>
    );
  }
  
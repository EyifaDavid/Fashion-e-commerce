import { useState } from "react";

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod = cash on delivery

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Checkout</h2>

      {/* Delivery Details */}
      <div className="space-y-4">
        <h3 className="font-semibold">Delivery Details</h3>
        <input type="text" placeholder="Full Name" className="w-full p-2 border rounded" />
        <input type="text" placeholder="Address" className="w-full p-2 border rounded" />
        <input type="tel" placeholder="Phone Number" className="w-full p-2 border rounded" />
        <input type="email" placeholder="Email (optional)" className="w-full p-2 border rounded" />
      </div>

      {/* Payment Method */}
      <div className="mt-6 space-y-4">
        <h3 className="font-semibold">Payment Method</h3>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
            />
            Pay on Delivery
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === "card"}
              onChange={() => setPaymentMethod("card")}
            />
            Pay with Card
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="payment"
              value="mobile"
              checked={paymentMethod === "mobile"}
              onChange={() => setPaymentMethod("mobile")}
            />
            Pay with Mobile Money
          </label>
        </div>

        {/* Card Payment Form */}
        {paymentMethod === "card" && (
          <div className="space-y-2 mt-2">
            <input type="text" placeholder="Card Number" className="w-full p-2 border rounded" />
            <input type="text" placeholder="Expiry Date (MM/YY)" className="w-full p-2 border rounded" />
            <input type="text" placeholder="CVV" className="w-full p-2 border rounded" />
          </div>
        )}

        {/* Mobile Money Form */}
        {paymentMethod === "mobile" && (
          <div className="space-y-2 mt-2">
            <input type="tel" placeholder="Mobile Number" className="w-full p-2 border rounded" />
            <select className="w-full p-2 border rounded">
              <option>Select Network</option>
              <option>MTN</option>
              <option>Vodafone</option>
              <option>AirtelTigo</option>
            </select>
          </div>
        )}
      </div>

      {/* Submit Button */}
      
    </div>
  );
}

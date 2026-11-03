// [NORTH] Retain the existing delivery/payment choices with readable, visible labels.
import { useState } from "react";

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState("cod");
  return (
    <div className="north-checkout-fields">
      <fieldset>
        <legend>Delivery details</legend>
        <div className="north-delivery-fields">
          <label>Full name<input type="text" autoComplete="name" /></label>
          <label>Address<input type="text" autoComplete="street-address" /></label>
          <label>Phone number<input type="tel" autoComplete="tel" /></label>
          <label>Email (optional)<input type="email" autoComplete="email" /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Payment method</legend>
        <div className="north-payment-options">
          {[["cod","Pay on delivery"],["card","Card"],["mobile","Mobile money"]].map(([value,label]) => (
            <label key={value}><input type="radio" name="payment" value={value} checked={paymentMethod===value}
              onChange={() => setPaymentMethod(value)} />{label}</label>
          ))}
        </div>
        {paymentMethod === "card" && <div className="north-delivery-fields">
          <label>Card number<input type="text" inputMode="numeric" autoComplete="cc-number" /></label>
          <label>Expiry date<input type="text" placeholder="MM/YY" autoComplete="cc-exp" /></label>
          <label>Security code<input type="password" inputMode="numeric" autoComplete="cc-csc" /></label>
        </div>}
        {paymentMethod === "mobile" && <div className="north-delivery-fields">
          <label>Mobile number<input type="tel" autoComplete="tel" /></label>
          <label>Network<select defaultValue=""><option value="" disabled>Select network</option>
            <option>MTN</option><option>Vodafone</option><option>AirtelTigo</option></select></label>
        </div>}
      </fieldset>
    </div>
  );
}

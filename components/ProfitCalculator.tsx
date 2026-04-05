"use client";

import { useState } from "react";

const products = [
  { label: "Unisex Heavy Cotton Tee ($8.80)", cost: 8.8 },
  { label: "Unisex Jersey Tee ($10.98)", cost: 10.98 },
  { label: "Unisex Softstyle T-Shirt ($7.95)", cost: 7.95 },
  { label: "Garment-Dyed T-Shirt ($12.41)", cost: 12.41 },
  { label: "Heavy Blend Crewneck ($15.24)", cost: 15.24 },
  { label: "Full Zip Hoodie ($30.98)", cost: 30.98 },
  { label: "Black Mug 11oz ($7.19)", cost: 7.19 },
  { label: "White Mug 11oz ($5.20)", cost: 5.2 },
  { label: "Ceramic Coffee Cup ($5.31)", cost: 5.31 },
];

export default function ProfitCalculator() {
  const [cost, setCost] = useState(8.8);
  const [sellPrice, setSellPrice] = useState(24.99);
  const [dailySales, setDailySales] = useState(2);

  const profit = Math.max(0, (sellPrice - cost) * dailySales * 30);

  return (
    <section className="calculator section" id="calculator">
      <div className="container">
        <h2>See how much you can make</h2>
        <p className="calculator__subtitle">Calculate your potential monthly earnings</p>
        <div className="calculator__card">
          <div className="calculator__row">
            <label htmlFor="product">Product</label>
            <select
              id="product"
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value))}
            >
              {products.map((p) => (
                <option key={p.label} value={p.cost}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="calculator__row">
            <label htmlFor="sell-price">Your selling price ($)</label>
            <input
              type="number"
              id="sell-price"
              value={sellPrice}
              min={0}
              step={0.01}
              onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="calculator__row">
            <label htmlFor="daily-sales">Estimated daily sales</label>
            <input
              type="number"
              id="daily-sales"
              value={dailySales}
              min={0}
              step={1}
              onChange={(e) => setDailySales(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="calculator__result">
            <div className="calculator__result-label">Your estimated monthly earnings</div>
            <div className="calculator__result-amount">
              ${profit.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <a href="#" className="btn btn--primary">Start designing</a>
          </div>
        </div>
      </div>
    </section>
  );
}

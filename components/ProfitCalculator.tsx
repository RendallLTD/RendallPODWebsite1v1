"use client";

import { useState } from "react";

const products = [
  { label: "Men's 180gsm Crewneck T-Shirt ($5.00)", cost: 5.0 },
  { label: "Kids' 180gsm Cotton T-Shirt ($6.20)", cost: 6.2 },
  { label: "Heavyweight Vintage Wash Drop-Shoulder Tee ($8.10)", cost: 8.1 },
  { label: "Men's Long Sleeve Crewneck T-Shirt ($7.00)", cost: 7.0 },
  { label: "Classic Pullover Fleece Hoodie ($12.40)", cost: 12.4 },
  { label: "Men's Crewneck Sweatshirt ($9.00)", cost: 9.0 },
  { label: "Kids' Premium Crewneck Sweatshirt ($9.60)", cost: 9.6 },
  { label: "Athletic Muscle Tank ($6.40)", cost: 6.4 },
  { label: "Classic Sleeveless T-Shirt ($7.00)", cost: 7.0 },
  { label: "Vintage Wash Sleeveless Tee ($8.00)", cost: 8.0 },
  { label: "Men's Short Sleeve Polo Shirt ($8.10)", cost: 8.1 },
  { label: "Men's Casual Lounge Shorts ($7.20)", cost: 7.2 },
  { label: "Men's T-Shirt & Shorts Set ($12.40)", cost: 12.4 },
  { label: "Men's Fleece-Lined Jacket ($19.60)", cost: 19.6 },
  { label: "Men's Colorblock Fleece-Lined Jacket ($19.60)", cost: 19.6 },
  { label: "Vintage Wash Denim Baseball Cap ($5.80)", cost: 5.8 },
  { label: "Vintage Wash Denim Trucker Hat ($5.80)", cost: 5.8 },
  { label: "Classic 6-Panel Sandwich Bill Cap ($5.80)", cost: 5.8 },
  { label: "Classic 5-Panel Sandwich Bill Cap ($5.80)", cost: 5.8 },
  { label: "Heavyweight Canvas Tote Bag ($5.00)", cost: 5.0 },
];

function getTier(monthlyUnits: number) {
  if (monthlyUnits >= 1000) return { name: "Retired My Mom", discount: 0.4 };
  if (monthlyUnits >= 500) return { name: "Full-Time", discount: 0.3 };
  if (monthlyUnits >= 100) return { name: "Side Hustle", discount: 0.1 };
  return { name: "Starter", discount: 0 };
}

export default function ProfitCalculator() {
  const [cost, setCost] = useState(5.0);
  const [sellPrice, setSellPrice] = useState(24.99);
  const [dailySales, setDailySales] = useState(5);

  const monthlyUnits = dailySales * 30;
  const tier = getTier(monthlyUnits);
  const discountedCost = cost * (1 - tier.discount);
  const profit = Math.max(0, (sellPrice - discountedCost) * monthlyUnits);

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
            <label htmlFor="sell-price" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span>Your selling price</span>
              <strong style={{ color: "var(--dark)", fontSize: 16 }}>${sellPrice.toFixed(2)}</strong>
            </label>
            <input
              type="range"
              id="sell-price"
              value={sellPrice}
              min={5}
              max={100}
              step={0.5}
              onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
              style={{ width: "100%" }}
            />
          </div>
          <div className="calculator__row">
            <label htmlFor="daily-sales" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span>Estimated daily sales</span>
              <strong style={{ color: "var(--dark)", fontSize: 16 }}>{dailySales} / day</strong>
            </label>
            <input
              type="range"
              id="daily-sales"
              value={dailySales}
              min={0}
              max={100}
              step={1}
              onChange={(e) => setDailySales(parseInt(e.target.value) || 0)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ textAlign: "center", padding: "12px 0", fontSize: 14, color: "var(--text-secondary)" }}>
            {monthlyUnits} units/month — <strong style={{ color: "var(--dark)" }}>{tier.name}</strong> tier{tier.discount > 0 && ` (${tier.discount * 100}% off)`}
          </div>
          <div className="calculator__result">
            <div className="calculator__result-label">Your estimated monthly earnings</div>
            <div className="calculator__result-amount">
              ${profit.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </div>
            {tier.discount > 0 && (
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                Your cost per unit: ${discountedCost.toFixed(2)} (was ${cost.toFixed(2)})
              </div>
            )}
          </div>
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <a
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px 32px",
                background: "#1a1a1a",
                color: "#fff",
                fontFamily: '"PP Neue Machina", "Hack", monospace',
                fontSize: 18,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              [ Start designing →&nbsp;]
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

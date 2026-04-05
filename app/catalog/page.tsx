"use client";

import { useState } from "react";
import Link from "next/link";
import { categories, type Product } from "@/lib/products";

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="product-card">
      <div className="product-card__img">{product.emoji}</div>
      <div className="product-card__body">
        <div className="product-card__brand">{product.brand}</div>
        <div className="product-card__name">{product.name}</div>
        <div className="product-card__price">From {product.price}</div>
        <div className="product-card__premium">From {product.premium} with Premium</div>
        <div className="product-card__meta">
          {product.meta.map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
    </Link>
  );
}

export default function CatalogPage() {
  const [filter, setFilter] = useState("all");

  return (
    <>
      <section className="catalog-hero">
        <div className="container">
          <h1>Rendall Catalog</h1>
          <p>Browse 1,300+ customizable products across all categories</p>
        </div>
      </section>

      <section className="catalog-filters">
        <div className="container">
          <div className="catalog-filters__tabs">
            {[
              { key: "all", label: "All Products" },
              { key: "clothing", label: "👕 Clothing" },
              { key: "accessories", label: "🎒 Accessories" },
              { key: "home", label: "🏠 Home & Living" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`filter-tab ${filter === tab.key ? "filter-tab--active" : ""}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {categories.map((sec) =>
        (filter === "all" || filter === sec.id) ? (
          <section key={sec.id} className="catalog-section container" id={sec.id}>
            <h2>{sec.label} <span className="count">{sec.products.length} products</span></h2>
            <div className="products-grid">
              {sec.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : null
      )}

      <section className="cta-section" style={{ marginTop: 48 }}>
        <div className="container">
          <h2>Ready to start selling?</h2>
          <p>Sign up for free and begin creating custom products today.</p>
          <Link href="/signup" className="btn btn--primary btn--lg">Get started for free</Link>
        </div>
      </section>
    </>
  );
}

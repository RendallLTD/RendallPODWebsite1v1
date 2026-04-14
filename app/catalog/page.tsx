import Link from "next/link";
import { subcategories, allProducts, getProductHero, type Product } from "@/lib/products";

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="product-card">
      <div className="product-card__img"><img src={getProductHero(product)} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
      <div className="product-card__body">
        <div className="product-card__brand">{product.brand}</div>
        <div className="product-card__name">{product.name}</div>
        <div className="product-card__price">From {product.price}</div>
        <div className="product-card__meta">
          {product.meta.map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
    </Link>
  );
}

export default function CatalogPage() {
  return (
    <>
      <section className="catalog-hero">
        <div className="container">
          <h1>Rendall Catalog</h1>
          <p>{allProducts.length} customizable products across {subcategories.length} categories</p>
        </div>
      </section>

      {subcategories.map((sub, i) => {
        const products = allProducts.filter((p) => p.subcategory === sub);
        if (products.length === 0) return null;
        return (
          <section key={sub} className="catalog-section container" id={sub.toLowerCase().replace(/\s+/g, "-")}>
            {i > 0 && <hr className="catalog-divider" />}
            <h2>{sub} <span className="count">{products.length} {products.length === 1 ? "product" : "products"}</span></h2>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}

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

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, getProductHero, allProducts } from "@/lib/products";
import SplatButton from "@/components/SplatButton";

export function generateStaticParams() {
  return allProducts.map((p) => ({ id: p.id }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  return (
    <>
      <section className="product-detail">
        <div className="container product-detail__layout">
          <div className="product-detail__image">
            <div className="product-detail__img-box"><img src={getProductHero(product)} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          </div>
          <div className="product-detail__info">
            <div className="product-detail__brand">{product.brand}</div>
            <h1>{product.name}</h1>
            <div className="product-detail__prices">
              <span className="product-detail__price">From {product.price}</span>
            </div>
            <p className="product-detail__desc">{product.description}</p>

            <div className="product-detail__option">
              <h3>Available Sizes</h3>
              <div className="product-detail__tags">
                {product.sizes.map((s) => <span key={s} className="tag">{s}</span>)}
              </div>
            </div>

            <div className="product-detail__option">
              <h3>Colors</h3>
              <div className="product-detail__tags">
                {product.colors.map((c) => <span key={c} className="tag">{c}</span>)}
              </div>
            </div>

            <div className="product-detail__option">
              <h3>Print Areas</h3>
              <div className="product-detail__tags">
                {product.printAreas.map((a) => <span key={a} className="tag">{a}</span>)}
              </div>
            </div>

            <div className="product-detail__meta">
              {product.meta.map((m) => <span key={m}>{m}</span>)}
            </div>

            <SplatButton href={`/design/${product.id}`}>Start designing</SplatButton>
          </div>
        </div>
      </section>
    </>
  );
}

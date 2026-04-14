const faqs = [
  { q: "What is print on demand?", a: "Print on demand (POD) is a fulfillment method where products are only printed after a customer places an order. You don't need to buy inventory upfront — we handle printing and shipping for you." },
  { q: "Is Rendall free to use?", a: "Yes! Our free plan lets you create unlimited designs, connect up to 5 stores, and access all integrations. You only pay the base product cost when an order is placed." },
  { q: "How does pricing work?", a: "You pay the base cost per product (shown in our catalog). You set your own retail price and keep the difference as profit. Premium members get up to 20% off base costs." },
  { q: "How long does shipping take?", a: "Orders are dispatched within 48 hours. Delivery to the end customer typically takes 3-7 additional business days within the US." },
  { q: "What products can I sell?", a: "We currently offer 21 products across 9 categories: T-Shirts, Kids apparel, Hoodies & Sweatshirts, Tank Tops, Polos, Sets & Shorts, Outerwear, Hats, and Bags. Browse our full catalog to see everything available." },
  { q: "Can I connect my own store?", a: "Not at this stage. Store integrations with platforms like Shopify, Etsy, and TikTok Shop are on our roadmap but not yet available. For now, you can order directly through Rendall and handle fulfillment to your customers manually." },
  { q: "What's the print quality like?", a: "We use DTF (direct-to-film) printing. Our goal is to deliver industry-standard quality that matches what you'd expect from any major POD platform." },
  { q: "Can I order samples?", a: "Yes, you can order samples at cost to check quality before selling. We recommend this for every new product you add." },
  { q: "What if a customer receives a defective product?", a: "We offer free reprints or refunds for any defective or damaged products. Just contact our support team with photos of the issue." },
  { q: "How do returns work?", a: "Since products are custom-printed, we don't accept returns for buyer's remorse. However, we cover reprints/refunds for quality issues, wrong items, or shipping damage." },
];

export default function FAQPage() {
  return (
    <section className="static-page">
      <div className="container static-page__content">
        <h1>Frequently Asked Questions</h1>
        <div className="faq-list">
          {faqs.map((faq) => (
            <div key={faq.q} className="faq-item">
              <h3>{faq.q}</h3>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

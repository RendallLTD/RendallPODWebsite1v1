const faqs = [
  { q: "What is print on demand?", a: "Print on demand (POD) is a fulfillment method where products are only printed after a customer places an order. You don't need to buy inventory upfront — we handle printing and shipping for you." },
  { q: "Is Rendall free to use?", a: "Yes! Our free plan lets you create unlimited designs, connect up to 5 stores, and access all integrations. You only pay the base product cost when an order is placed." },
  { q: "How does pricing work?", a: "You pay the base cost per product (shown in our catalog). You set your own retail price and keep the difference as profit. Premium members get up to 20% off base costs." },
  { q: "How long does shipping take?", a: "Most orders are printed and shipped within 2-5 business days. Delivery to the end customer typically takes 3-7 additional business days within the US." },
  { q: "What products can I sell?", a: "We offer 1,300+ products including t-shirts, hoodies, mugs, phone cases, posters, stickers, bags, and more. Browse our full catalog to see everything available." },
  { q: "Can I connect my own store?", a: "Yes! Rendall integrates with Shopify, Etsy, WooCommerce, Amazon, eBay, TikTok Shop, Wix, Squarespace, and BigCommerce." },
  { q: "What's the print quality like?", a: "We use industry-standard DTG (direct-to-garment) and sublimation printing. Our print quality matches or exceeds other major POD platforms." },
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

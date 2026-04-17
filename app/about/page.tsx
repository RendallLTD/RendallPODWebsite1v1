import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="static-page">
      <div className="container static-page__content">
        <h1>About Rendall</h1>
        <p className="static-page__lead">
          We&apos;re building the most affordable print-on-demand network in the world — without compromising on quality or speed.
        </p>

        <h2>Our Story</h2>
        <p>
          Rendall was founded in Hong Kong in April 2026, after years of seeing the same gap in the print-on-demand industry: sellers were paying too much. By contracting directly with manufacturing partners and using US-based print fulfillment partners, we&apos;re able to offer prices up to 50% lower than existing platforms — while matching them on product quality and delivery speed.
        </p>

        <h2>How It Works</h2>
        <p>
          Blank products are manufactured by our partner factory and then routed to US-based print fulfillment partners. When your customer places an order, your design is printed and shipped directly to them. You never touch inventory, never pay upfront, and never carry production risk.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe everyone should be able to start a product business with zero upfront cost. Rendall makes that possible by handling manufacturing, printing, and shipping — so you can focus on creating great designs and building your brand.
        </p>

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <Link href="/signup" className="btn btn--primary btn--lg">Start selling for free</Link>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "56px 0 32px" }} />

        <h2>Company Information</h2>
        <p>
          Rendall is operated by <strong>Rendall Limited</strong> (倫德爾有限公司), a Hong Kong private company limited by shares. Full registration details and our registered office appear in the site footer. For intellectual-property and content takedown requests, see our <Link href="/dmca">DMCA / Takedown procedure</Link>.
        </p>
      </div>
    </section>
  );
}

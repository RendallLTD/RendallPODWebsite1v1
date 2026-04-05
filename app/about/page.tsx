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
          Rendall was founded by a team of 7 who saw a gap in the print-on-demand industry: sellers were paying too much. By partnering directly with manufacturers and building an efficient fulfillment network across the United States, we&apos;re able to offer prices up to 50% lower than existing platforms — while matching them on product quality and delivery speed.
        </p>

        <h2>How It Works</h2>
        <p>
          Our partner factory manufactures blank products in China, which are then shipped to fulfillment centers with printing capabilities across the US. When your customer places an order, we print your design and ship it directly to them. You never touch inventory.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe everyone should be able to start a product business with zero upfront cost. Rendall makes that possible by handling manufacturing, printing, and shipping — so you can focus on creating great designs and building your brand.
        </p>

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <Link href="/signup" className="btn btn--primary btn--lg">Start selling for free</Link>
        </div>
      </div>
    </section>
  );
}

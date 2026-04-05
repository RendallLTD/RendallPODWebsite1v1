import Link from "next/link";
import ProfitCalculator from "@/components/ProfitCalculator";

const categories = [
  { name: "T-Shirts", emoji: "👕", href: "/catalog#clothing" },
  { name: "Hoodies", emoji: "🧣", href: "/catalog#clothing" },
  { name: "Sweatshirts", emoji: "👖", href: "/catalog#clothing" },
  { name: "Mugs", emoji: "☕", href: "/catalog#home" },
  { name: "Phone Cases", emoji: "📱", href: "/catalog#accessories" },
  { name: "Posters", emoji: "🖼", href: "/catalog#home" },
  { name: "Candles", emoji: "🕯", href: "/catalog#home" },
  { name: "Stickers", emoji: "📌", href: "/catalog#accessories" },
  { name: "Bags", emoji: "🎒", href: "/catalog#accessories" },
  { name: "Kids Clothing", emoji: "👶", href: "/catalog#clothing" },
];

const features = [
  { icon: "🎨", title: "Create your designs", desc: "Use our free mockup generator to add your designs to 1,300+ products. No design skills needed — just upload and preview." },
  { icon: "🛒", title: "Connect your store", desc: "Integrate with Etsy, Shopify, WooCommerce, Amazon, eBay and more. Sync products automatically to your online store." },
  { icon: "💰", title: "Start selling", desc: "When a customer buys, we print and ship directly to them. You set the retail price and keep the profit — zero inventory risk." },
  { icon: "🌍", title: "Global fulfillment", desc: "Our network of 140+ print providers in 30+ countries ensures fast, reliable delivery to customers worldwide." },
];

const stats = [
  { number: "10M+", label: "Merchants worldwide" },
  { number: "60M+", label: "Total orders fulfilled" },
  { number: "209", label: "Countries & territories" },
  { number: "141", label: "Print facilities" },
];

const integrations = ["Shopify", "Etsy", "WooCommerce", "Amazon", "eBay", "TikTok Shop", "Wix", "Squarespace", "BigCommerce"];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <h1>Create and sell<br />custom products</h1>
          <div className="hero__checks">
            {["100% Free to use", "1,300+ High-Quality Products", "Global Delivery"].map((text) => (
              <div key={text} className="hero__check">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                {text}
              </div>
            ))}
          </div>
          <div className="hero__cta">
            <Link href="/signup" className="btn btn--primary btn--lg">Get started for free</Link>
          </div>
          <p className="hero__sub">No credit card required</p>
          <div className="hero__trust">
            <span className="hero__trust-text">Trusted by 10M+ sellers</span>
            <div className="trust-badge"><span className="stars">★★★★★</span> 4.8 on Shopify</div>
            <div className="trust-badge"><span className="stars">★★★★★</span> 4.8 on Trustpilot</div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="categories">
        <div className="container">
          <h2>Explore our products</h2>
          <div className="categories__grid">
            {categories.map((cat) => (
              <Link key={cat.name} href={cat.href} className="category-card">
                <div className="category-card__img">{cat.emoji}</div>
                <div className="category-card__name">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="features section" id="how-it-works">
        <div className="container">
          <h2>How Rendall works</h2>
          <p className="features__subtitle">Create, sell, and ship custom products — we handle the rest.</p>
          <div className="features__grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <ProfitCalculator />

      {/* STATS */}
      <section className="stats section">
        <div className="container">
          <h2>Rendall by the numbers</h2>
          <div className="stats__grid">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="stat__number">{s.number}</div>
                <div className="stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRESS */}
      <section className="press">
        <div className="container">
          <div className="press__logos">
            {["Business Insider", "Forbes", "CNBC", "Entrepreneur", "Washington Post", "Wall Street Journal"].map((name) => (
              <span key={name} className="press__logo">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="section section--cream" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <p style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-secondary)", marginBottom: 24, fontWeight: 600 }}>What sellers say</p>
          <blockquote style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.6, marginBottom: 24 }}>
            &ldquo;I&apos;ve been using Rendall for about two years. It allowed me to quit my job within 9 months of starting my print-on-demand business.&rdquo;
          </blockquote>
          <p style={{ fontWeight: 700 }}>Christina U.</p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Toronto, Canada</p>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="section" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>Connect and start selling</h2>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", marginBottom: 40 }}>Integrate with the top e-commerce platforms and marketplaces</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginBottom: 40 }}>
            {integrations.map((name) => (
              <span key={name} className="trust-badge" style={{ fontSize: 15, padding: "12px 20px" }}>{name}</span>
            ))}
          </div>
          <a href="#" className="btn btn--outline">See all integrations</a>
        </div>
      </section>

      {/* PRICING */}
      <section className="section section--cream" id="pricing">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, textAlign: "center", marginBottom: 8 }}>Simple, transparent pricing</h2>
          <p style={{ textAlign: "center", fontSize: 18, color: "var(--text-secondary)", marginBottom: 48 }}>Start for free. Upgrade when you&apos;re ready.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {/* Free */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Free</div>
              <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4 }}>$0</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>per month</div>
              <ul style={{ listStyle: "none", marginBottom: 32 }}>
                {["5 stores", "Unlimited product designs", "Free mockup generator", "All integrations", "24/7 support"].map((item) => (
                  <li key={item} style={{ padding: "6px 0", fontSize: 15 }}>&#10003; {item}</li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn--outline" style={{ width: "100%" }}>Get started</Link>
            </div>
            {/* Premium */}
            <div style={{ background: "#fff", border: "2px solid var(--accent-active)", borderRadius: "var(--radius-lg)", padding: 32, position: "relative" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "var(--dark)", fontSize: 12, fontWeight: 700, padding: "4px 16px", borderRadius: 12 }}>MOST POPULAR</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-active)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Premium</div>
              <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4 }}>$29.99</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>per month</div>
              <ul style={{ listStyle: "none", marginBottom: 32 }}>
                {["10 stores", "Everything in Free", "Up to 20% discount on products", "Priority support", "Custom branding"].map((item) => (
                  <li key={item} style={{ padding: "6px 0", fontSize: 15 }}>&#10003; {item}</li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn--primary" style={{ width: "100%" }}>Start free trial</Link>
            </div>
            {/* Enterprise */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Enterprise</div>
              <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4 }}>Custom</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>tailored to you</div>
              <ul style={{ listStyle: "none", marginBottom: 32 }}>
                {["Unlimited stores", "Everything in Premium", "Dedicated account manager", "Custom API integration", "Bulk order discounts"].map((item) => (
                  <li key={item} style={{ padding: "6px 0", fontSize: 15 }}>&#10003; {item}</li>
                ))}
              </ul>
              <a href="#" className="btn btn--dark" style={{ width: "100%" }}>Talk to sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Start selling today — 100% free</h2>
          <p>No credit card. No risk. No inventory. Just your designs and our products.</p>
          <Link href="/signup" className="btn btn--primary btn--lg">Get started for free</Link>
        </div>
      </section>
    </>
  );
}

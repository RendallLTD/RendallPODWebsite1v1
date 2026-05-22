import Link from "next/link";
import Image from "next/image";
import HeroSlideshow from "@/components/HeroSlideshow";
import ProfitCalculator from "@/components/ProfitCalculator";

const categories = [
  { name: "T-Shirts", image: "/products/mens-crewneck-tee/white/mens-crewneck-tee-white.png", href: "/catalog#t-shirts" },
  { name: "Kids", image: "/products/kids-cotton-tee.png", href: "/catalog#kids" },
  { name: "Hoodies & Sweatshirts", image: "/products/classic-pullover-hoodie.png", href: "/catalog#hoodies-&-sweatshirts" },
  { name: "Tank Tops", image: "/products/athletic-muscle-tank.png", href: "/catalog#tank-tops" },
  { name: "Polos", image: "/products/mens-polo-shirt.png", href: "/catalog#polos" },
  { name: "Sets & Shorts", image: "/products/mens-tshirt-shorts-set.png", href: "/catalog#sets-&-shorts" },
  { name: "Outerwear", image: "/products/mens-colorblock-jacket.png", href: "/catalog#outerwear" },
  { name: "Hats", image: "/products/classic-6-panel-cap.png", href: "/catalog#hats" },
  { name: "Bags", image: "/products/heavyweight-canvas-tote.png", href: "/catalog#bags" },
];

const features = [
  { icon: "🎨", title: "Create your designs", desc: "Use our free mockup generator to add your designs to 21 customizable products across 9 categories. No design skills needed — just upload and preview." },
  { icon: "🛒", title: "Order on demand", desc: "Order exactly what you need, when you need it. No minimums, no inventory — we print and ship every order as it comes in." },
  { icon: "💰", title: "Start selling", desc: "When a customer buys, we print and ship directly to them. You set the retail price and keep the profit — zero inventory risk." },
  { icon: "🌍", title: "US fulfillment", desc: "Our network of 11 print facilities across the United States ensures fast, reliable delivery with 48-hour dispatch." },
];

const stats = [
  { number: "11", label: "Print facilities in US" },
  { number: "48H", label: "US dispatch" },
  { number: "21", label: "Customizable products" },
  { number: "9", label: "Product categories" },
];

const integrations = ["Shopify", "Etsy", "WooCommerce", "Amazon", "eBay", "TikTok Shop", "Wix", "Squarespace", "BigCommerce"];

export default function Home() {
  return (
    <>
      {/* HERO — dotted title with model cutouts overlapping into it */}
      <section style={{ background: "#fff", padding: "32px 0 16px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <h1 className="font-dot" style={{ fontSize: "clamp(36px, 14vw, 240px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em", margin: 0, color: "var(--dark)", textTransform: "none", whiteSpace: "nowrap", position: "relative", zIndex: 1 }}>
          IDEA -&gt; INCOME
        </h1>
      </section>

      <section style={{ padding: 0, marginTop: "-4vw", position: "relative", pointerEvents: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px, 520px) 1fr", alignItems: "end", gap: 24, width: "100%" }}>
          {/* Left model slot — rotating set A (girls + white guy) */}
          <div className="hero-model-slot hero-model-slot--zoom" style={{ position: "relative", zIndex: 2, "--slot-render-height": "115vh" } as React.CSSProperties}>
            <HeroSlideshow
              photos={[
                { src: "/hero-slideshow/asian-girl.png", alt: "Asian girl mockup" },
                { src: "/hero-slideshow/olive-girl.png", alt: "Olive skinned girl mockup" },
                { src: "/hero-slideshow/white-guy.png", alt: "White guy mockup" },
              ]}
              photoMs={5000}
            />
          </div>

          {/* Center CTA */}
          <div style={{ textAlign: "center", alignSelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, pointerEvents: "auto", position: "relative", zIndex: 3 }}>
            <div className="hero__checks" style={{ flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 0 }}>
              {["100% Free to use", "48H Dispatch Within US"].map((text) => (
                <div key={text} className="hero__check">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                  {text}
                </div>
              ))}
            </div>
            <Link
              href="/catalog"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px 32px",
                background: "#1a1a1a",
                color: "#fff",
                fontFamily: '"PP Neue Machina", "Hack", monospace',
                fontSize: 20,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              [ View catalog →&nbsp;]
            </Link>
            <p className="hero__sub" style={{ margin: 0 }}>No credit card required</p>
            {/* sub has its own margin-bottom from .hero__sub class — already overridden to 0 by inline */}
          </div>

          {/* Right model slot — rotating set B (other guys), staggered start so no collision */}
          <div className="hero-model-slot" style={{ position: "relative", zIndex: 2, "--slot-offset-y": "-8vh" } as React.CSSProperties}>
            <HeroSlideshow
              photos={[
                { src: "/hero-slideshow/asian-guy.png", alt: "Asian guy mockup" },
                { src: "/hero-slideshow/black-guy.png", alt: "Black guy mockup" },
              ]}
              photoMs={5000}
            />
          </div>
        </div>
      </section>

      <hr className="divider-dotted" />

      {/* CATEGORIES */}
      <section className="categories">
        <div className="container">
          <h2>Explore our products</h2>
          <div className="categories__grid">
            {categories.map((cat) => (
              <Link key={cat.name} href={cat.href} className="category-card">
                <div className="category-card__img">
                  <Image src={cat.image} alt={cat.name} width={160} height={160} />
                </div>
                <div className="category-card__name">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider-dotted" />

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

      <hr className="divider-dotted" />

      {/* CALCULATOR */}
      <ProfitCalculator />

      <hr className="divider-dotted" />

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

      <hr className="divider-dotted" />

      {/* PRICING + CTA — flat background */}
      <div style={{ position: "relative", background: "#fff" }}>
      <section className="section" id="pricing" style={{ position: "relative", background: "transparent" }}>
        <div className="container" style={{ maxWidth: 900, position: "relative" }}>
          <h2 style={{ fontSize: 24, fontWeight: 400, textAlign: "center", marginBottom: 12 }}>Performance-Based Pricing</h2>
          <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>The more you sell this month, the bigger your discount next month.</p>
          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>

            {/* SIDE HUSTLE — step 1 (red accent, dense dotted border) */}
            <div className="pricing-card" style={{ background: "#fff", border: "1px dotted #d96b6b", padding: "32px 24px", position: "relative", "--card-accent": "#d96b6b" } as React.CSSProperties}>
              <div style={{ fontSize: 12, color: "#d96b6b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 24 }}>Side Hustle</div>
              <div style={{ fontSize: 20, color: "var(--dark)", marginBottom: 4 }}>100+</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>units sold / month</div>
              <div className="font-dot" style={{ fontSize: 48, color: "var(--dark)", lineHeight: 1, marginBottom: 8 }}>10%</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 32 }}>off all products</div>
              <div style={{ background: "#fbeaea", padding: "16px", marginBottom: 32, fontSize: 14, color: "var(--dark)", display: "grid", gridTemplateColumns: "1fr auto", rowGap: 8, columnGap: 16 }}>
                <span>Sold for</span><span style={{ textAlign: "right" }}>$25</span>
                <span>Your cost</span><span style={{ textAlign: "right" }}>$4.50</span>
                <span>Profit</span><span style={{ textAlign: "right" }}>$20.50</span>
                <span>100 units</span><span style={{ textAlign: "right", fontWeight: 600 }}>$2,050/mo</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Half your rent.</div>
            </div>

            {/* FULL-TIME — step 2 (blue accent, dashed border) */}
            <div className="pricing-card" style={{ background: "#fff", border: "2px dashed #5e7ba8", padding: "32px 24px", position: "relative", "--card-accent": "#5e7ba8" } as React.CSSProperties}>
              <div style={{ fontSize: 12, color: "#5e7ba8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 24 }}>Full-Time</div>
              <div style={{ fontSize: 20, color: "var(--dark)", marginBottom: 4 }}>500+</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>units sold / month</div>
              <div className="font-dot" style={{ fontSize: 48, color: "var(--dark)", lineHeight: 1, marginBottom: 8 }}>30%</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 32 }}>off all products</div>
              <div style={{ background: "#e7ebf2", padding: "16px", marginBottom: 32, fontSize: 14, color: "var(--dark)", display: "grid", gridTemplateColumns: "1fr auto", rowGap: 8, columnGap: 16 }}>
                <span>Sold for</span><span style={{ textAlign: "right" }}>$25</span>
                <span>Your cost</span><span style={{ textAlign: "right" }}>$3.50</span>
                <span>Profit</span><span style={{ textAlign: "right" }}>$21.50</span>
                <span>500 units</span><span style={{ textAlign: "right", fontWeight: 600 }}>$10,750/mo</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>The legendary $10K month. The coveted 6-figure year.</div>
            </div>

            {/* RETIRED MY MOM — step 3 (green accent, solid border) */}
            <div className="pricing-card" style={{ background: "#fff", border: "3px solid #67b079", padding: "32px 24px", position: "relative", "--card-accent": "#67b079" } as React.CSSProperties}>
              <div style={{ fontSize: 12, color: "#67b079", textTransform: "uppercase", letterSpacing: 1, marginBottom: 24 }}>Retired My Mom</div>
              <div style={{ fontSize: 20, color: "var(--dark)", marginBottom: 4 }}>1,000+</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>units sold / month</div>
              <div className="font-dot" style={{ fontSize: 48, color: "var(--dark)", lineHeight: 1, marginBottom: 8 }}>40%</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 32 }}>off all products</div>
              <div style={{ background: "#e3efe6", padding: "16px", marginBottom: 32, fontSize: 14, color: "var(--dark)", display: "grid", gridTemplateColumns: "1fr auto", rowGap: 8, columnGap: 16 }}>
                <span>Sold for</span><span style={{ textAlign: "right" }}>$25</span>
                <span>Your cost</span><span style={{ textAlign: "right" }}>$3.00</span>
                <span>Profit</span><span style={{ textAlign: "right" }}>$22.00</span>
                <span>1,000u</span><span style={{ textAlign: "right", fontWeight: 600 }}>$22,000/mo</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Retire your mom... or buy a 911.</div>
            </div>

          </div>

        </div>

        <hr style={{ border: "none", borderTop: "2px dotted rgba(255,255,255,0.4)", margin: "64px 0 0", position: "relative" }} />

        <div className="container" style={{ maxWidth: 900, position: "relative" }}>

          {/* Discount curve chart */}
          <div style={{ marginTop: "var(--space-7)", textAlign: "center", background: "#fff", border: "1px solid var(--dark)", padding: "var(--space-6) var(--space-5)" }}>
            <h3 style={{ fontSize: "var(--text-display)", fontWeight: 400, marginBottom: "var(--space-1)" }}>Your savings grow with you</h3>
            <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: "var(--space-5)" }}>The jump from Side Hustle to Full-Time is where the real money kicks in.</p>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <svg viewBox="0 0 600 280" style={{ width: "100%", height: "auto" }}>
                {/* Grid lines */}
                {[0, 10, 20, 30, 40].map((val) => {
                  const y = 240 - (val / 40) * 200;
                  return (
                    <g key={val}>
                      <line x1="80" y1={y} x2="560" y2={y} stroke="#e5e5e5" strokeWidth="1" strokeDasharray={val === 0 ? "0" : "4 4"} />
                      <text x="70" y={y + 4} textAnchor="end" fontSize="12" fill="var(--text-secondary)">{val}%</text>
                    </g>
                  );
                })}

                {/* Side Hustle — 10% (step-1 red) */}
                <rect x="120" y={240 - (10 / 40) * 200} width="80" height={(10 / 40) * 200} fill="var(--step-1)" />
                <text x="160" y={240 - (10 / 40) * 200 - 10} textAnchor="middle" fontSize="18" fill="var(--dark)">10%</text>
                <text x="160" y={264} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">100 units</text>

                {/* Full-Time — 30% (step-2 blue, hero bar) */}
                <rect x="260" y={240 - (30 / 40) * 200} width="80" height={(30 / 40) * 200} fill="var(--step-2)" />
                <text x="300" y={240 - (30 / 40) * 200 - 10} textAnchor="middle" fontSize="22" fill="var(--dark)">30%</text>
                <text x="300" y={264} textAnchor="middle" fontSize="11" fill="var(--dark)">500 units</text>

                {/* Retired My Mom — 40% (step-3 green) */}
                <rect x="400" y={240 - (40 / 40) * 200} width="80" height={(40 / 40) * 200} fill="var(--step-3)" />
                <text x="440" y={240 - (40 / 40) * 200 - 10} textAnchor="middle" fontSize="18" fill="var(--dark)">40%</text>
                <text x="440" y={264} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">1,000+ units</text>

                {/* Annotation arrow */}
                <path d="M 170 185 C 200 120, 250 100, 290 98" fill="none" stroke="var(--dark)" strokeWidth="1" strokeDasharray="4 3" />
                <text x="215" y="112" textAnchor="middle" fontSize="11" fill="var(--dark)">3x jump</text>
              </svg>
            </div>

            {/* Real-world example */}
            <div style={{ background: "#fff", border: "1px solid var(--dark)", padding: "var(--space-4) var(--space-5)", maxWidth: 540, margin: "var(--space-5) auto 0" }}>
              <div style={{ fontSize: "var(--text-caption)", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "var(--track-wide)", marginBottom: "var(--space-3)" }}>Real example &mdash; Men&apos;s Crewneck T-Shirt</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--space-2)", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--text-secondary)", marginBottom: "var(--space-1)" }}>Base Price</div>
                  <div style={{ fontSize: "var(--text-display)", color: "var(--dark)" }}>$5.00</div>
                </div>
                <div>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--step-1)", marginBottom: "var(--space-1)" }}>Side Hustle</div>
                  <div style={{ fontSize: "var(--text-display)", color: "var(--dark)" }}>$4.50</div>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--text-secondary)" }}>save $0.50</div>
                </div>
                <div style={{ background: "var(--step-2-tint)", padding: "var(--space-2) var(--space-1)" }}>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--step-2)", marginBottom: "var(--space-1)" }}>Full-Time</div>
                  <div style={{ fontSize: "var(--text-display)", color: "var(--dark)" }}>$3.50</div>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--step-2)" }}>save $1.50</div>
                </div>
                <div>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--step-3)", marginBottom: "var(--space-1)" }}>Retired My Mom</div>
                  <div style={{ fontSize: "var(--text-display)", color: "var(--dark)" }}>$3.00</div>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--text-secondary)" }}>save $2.00</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <hr className="divider-dotted" />

      {/* BOTTOM PROVOCATION */}
      <section style={{ background: "transparent", position: "relative", padding: "80px 16px 40px", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <h2 style={{ fontSize: "clamp(28px, 4.5vw, 56px)", fontWeight: 400, lineHeight: 1.15, textTransform: "uppercase", color: "var(--dark)", margin: 0 }}>
            HOW MANY T SHIRTS DO YOU NEED TO SELL TO MAKE 1M DOLLARS?
          </h2>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-section" style={{ background: "transparent", position: "relative" }}>
        <div className="container">
          <h2 style={{ color: "var(--dark)" }}>Start selling today — 100% free</h2>
          <p style={{ color: "var(--text-secondary)" }}>No credit card. No risk. No inventory. Just your designs and our products.</p>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 32px",
              background: "#1a1a1a",
              color: "#fff",
              fontFamily: '"PP Neue Machina", "Hack", monospace',
              fontSize: 20,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            [ Get started for free →&nbsp;]
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}

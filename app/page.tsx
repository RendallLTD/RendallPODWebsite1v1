import Link from "next/link";
import Image from "next/image";
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
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <Image src="/logo.svg" alt="Rendall" width={240} height={196} className="hero__logo" priority />
          <h1>Create and sell<br />custom products</h1>
          <div className="hero__checks">
            {["100% Free to use", "21 Customizable Products", "48H Dispatch Within US"].map((text) => (
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

      {/* PRICING + CTA — continuous gradient to footer */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #ffffff 0%, #3a3a3a 70%, #0f0f0f 100%)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 85% 75%, rgba(255,92,53,0.22), transparent 55%), radial-gradient(ellipse at 15% 65%, rgba(233,173,206,0.12), transparent 50%)",
            pointerEvents: "none",
          }}
        />
      <section className="section" id="pricing" style={{ position: "relative", background: "transparent" }}>
        <div className="container" style={{ maxWidth: 900, position: "relative" }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, textAlign: "center", marginBottom: 8 }}>Performance-Based Pricing</h2>
          <p style={{ textAlign: "center", fontSize: 18, color: "var(--text-secondary)", marginBottom: 12 }}>The more you sell this month, the bigger your discount next month.</p>
          <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-secondary)", marginBottom: 56, opacity: 0.8 }}>Hit your monthly volume &rarr; unlock lower product costs automatically for the next month.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>

            {/* SIDE HUSTLE */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "32px 28px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Side Hustle</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--dark)", marginBottom: 4 }}>100+</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>units sold / month</div>
              <div className="font-dot" style={{ fontSize: 56, fontWeight: 900, color: "var(--dark)", lineHeight: 1, marginBottom: 2 }}>10%</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>off all products</div>
              <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "16px", marginBottom: 28, fontSize: 14, color: "var(--text-secondary)", lineHeight: 2 }}>
                <div>T-Shirt sold for $25</div>
                <div>Your cost: $4.50</div>
                <div>Profit per unit: $20.50</div>
                <div>100 units = <span style={{ color: "var(--dark)", fontWeight: 600 }}>$2,050/mo</span></div>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1 }}>That&apos;s half your rent bro</div>
            </div>

            {/* FULL-TIME — hero card */}
            <div style={{ background: "#fff", border: "3px solid var(--accent-active)", borderRadius: "var(--radius-lg)", padding: "32px 28px", position: "relative" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-active)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Full-Time</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--dark)", marginBottom: 4 }}>500+</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>units sold / month</div>
              <div className="font-dot" style={{ fontSize: 56, fontWeight: 900, color: "var(--dark)", lineHeight: 1, marginBottom: 2 }}>30%</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>off all products</div>
              <div style={{ background: "rgba(255,92,53,0.1)", borderRadius: 8, padding: "16px", marginBottom: 28, fontSize: 14, color: "var(--dark)", lineHeight: 2 }}>
                <div>T-Shirt sold for $25</div>
                <div>Your cost: $3.50</div>
                <div>Profit per unit: $21.50</div>
                <div>500 units = <span style={{ fontWeight: 600 }}>$10,750/mo</span></div>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>The legendary $10K month. The coveted 6-figure year.</div>
            </div>

            {/* RETIRED MY MOM */}
            <div style={{ background: "var(--dark)", border: "1px solid var(--dark)", borderRadius: "var(--radius-lg)", padding: "32px 28px", color: "#fff" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Retired My Mom</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 }}>1,000+</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>units sold / month</div>
              <div className="font-dot" style={{ fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 2 }}>40%</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>off all products</div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "16px", marginBottom: 28, fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 2 }}>
                <div>T-Shirt sold for $25</div>
                <div>Your cost: $3.00</div>
                <div>Profit per unit: $22.00</div>
                <div>1,000 units = <span style={{ color: "#fff", fontWeight: 600 }}>$22,000/mo</span></div>
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Retire your mom... or buy a 911.</div>
            </div>

          </div>

        </div>

        <hr style={{ border: "none", borderTop: "2px dotted rgba(255,255,255,0.4)", margin: "64px 0 0", position: "relative" }} />

        <div className="container" style={{ maxWidth: 900, position: "relative" }}>

          {/* Discount curve chart */}
          <div style={{ marginTop: 64, textAlign: "center", background: "rgba(255,255,255,0.94)", borderRadius: "var(--radius-lg)", padding: "48px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", backdropFilter: "blur(8px)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Your savings grow with you</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>The jump from Side Hustle to Full-Time is where the real money kicks in.</p>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <svg viewBox="0 0 600 280" style={{ width: "100%", height: "auto" }}>
                {/* Grid lines */}
                {[0, 10, 20, 30, 40].map((val) => {
                  const y = 240 - (val / 40) * 200;
                  return (
                    <g key={val}>
                      <line x1="80" y1={y} x2="560" y2={y} stroke="#e5e5e5" strokeWidth="1" strokeDasharray={val === 0 ? "0" : "4 4"} />
                      <text x="70" y={y + 4} textAnchor="end" fontSize="12" fill="#999" fontWeight="500">{val}%</text>
                    </g>
                  );
                })}

                {/* Bars */}
                {/* Side Hustle — 10% */}
                <rect x="120" y={240 - (10 / 40) * 200} width="80" height={(10 / 40) * 200} rx="6" fill="#d4d4d4" />
                <text x="160" y={240 - (10 / 40) * 200 - 10} textAnchor="middle" fontSize="18" fontWeight="900" fill="#737373">10%</text>
                <text x="160" y={264} textAnchor="middle" fontSize="11" fill="#999" fontWeight="600">100 units</text>

                {/* Full-Time — 30% (hero bar) */}
                <rect x="260" y={240 - (30 / 40) * 200} width="80" height={(30 / 40) * 200} rx="6" fill="var(--accent)" />
                <text x="300" y={240 - (30 / 40) * 200 - 10} textAnchor="middle" fontSize="22" fontWeight="900" fill="var(--dark)">30%</text>
                <text x="300" y={264} textAnchor="middle" fontSize="11" fill="var(--dark)" fontWeight="700">500 units</text>

                {/* Retired My Mom — 40% */}
                <rect x="400" y={240 - (40 / 40) * 200} width="80" height={(40 / 40) * 200} rx="6" fill="var(--dark)" />
                <text x="440" y={240 - (40 / 40) * 200 - 10} textAnchor="middle" fontSize="18" fontWeight="900" fill="var(--dark)">40%</text>
                <text x="440" y={264} textAnchor="middle" fontSize="11" fill="#999" fontWeight="600">1,000+ units</text>

                {/* Accent arrow showing the big jump */}
                <path d="M 170 185 C 200 120, 250 100, 290 98" fill="none" stroke="var(--accent-active)" strokeWidth="2" strokeDasharray="6 3" />
                <text x="215" y="115" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--accent-active)">3x jump</text>
              </svg>
            </div>

            {/* Real-world example */}
            <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "2px solid var(--dark)", padding: "24px 32px", maxWidth: 540, margin: "36px auto 0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Real example &mdash; Men&apos;s Crewneck T-Shirt</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>Base Price</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "var(--dark)" }}>$5.00</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>Side Hustle</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#999" }}>$4.50</div>
                  <div style={{ fontSize: 11, color: "#999" }}>save $0.50</div>
                </div>
                <div style={{ background: "var(--accent)", borderRadius: 8, padding: "8px 4px" }}>
                  <div style={{ fontSize: 11, color: "var(--dark)", marginBottom: 4, fontWeight: 600 }}>Full-Time</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "var(--dark)" }}>$3.50</div>
                  <div style={{ fontSize: 11, color: "var(--dark)", fontWeight: 700 }}>save $1.50</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>Retired My Mom</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "var(--dark)" }}>$3.00</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>save $2.00</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <hr style={{ border: "none", borderTop: "2px dotted rgba(255,255,255,0.4)", margin: 0, position: "relative" }} />

      {/* FINAL CTA */}
      <section className="cta-section" style={{ background: "transparent", position: "relative" }}>
        <div className="container">
          <h2 style={{ color: "#fff" }}>Start selling today — 100% free</h2>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>No credit card. No risk. No inventory. Just your designs and our products.</p>
          <Link href="/signup" className="btn btn--primary btn--lg">Get started for free</Link>
        </div>
      </section>
      </div>
    </>
  );
}

import Link from "next/link";

export default function HelpPage() {
  return (
    <section className="static-page">
      <div className="container static-page__content">
        <h1>Help Center</h1>
        <p className="static-page__lead">Need help? We&apos;re here for you.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginTop: 40 }}>
          <div className="feature-card">
            <h3>Getting Started</h3>
            <p>New to Rendall? Check out our <Link href="/faq" style={{ color: "var(--accent-active)", fontWeight: 600 }}>FAQ page</Link> for answers to common questions about how print-on-demand works.</p>
          </div>
          <div className="feature-card">
            <h3>Email Support</h3>
            <p>Reach our team at <strong>support@rendall.com</strong>. We typically respond within 24 hours.</p>
          </div>
          <div className="feature-card">
            <h3>Order Issues</h3>
            <p>For issues with a specific order (defects, wrong item, shipping damage), email us with your order number and photos.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

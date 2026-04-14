import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="logo">
              rend<span>all</span>
            </div>
            <p>The print-on-demand platform that matches everyone on quality — and aims to beat everyone on price. Create custom products, connect your store, and start earning.</p>
            <div className="footer__socials">
              <a href="https://www.instagram.com/rendall.pod" target="_blank" rel="noopener noreferrer" className="footer__social" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer__col">
            <h4>Discover</h4>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/catalog">Product Catalog</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/signup">Start a POD Business</Link>
          </div>
          <div className="footer__col">
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/help">Help Center</Link>
            <Link href="/policies#privacy">Privacy Policy</Link>
            <Link href="/policies#refund">Refund Policy</Link>
            <Link href="/policies#terms">Terms of Service</Link>
            <Link href="/policies#shipping">Shipping Policy</Link>
          </div>
        </div>
        <div className="footer__bottom">
          <span>&copy; 2026 Rendall, Inc. All rights reserved.</span>
          <div className="footer__links">
            <Link href="/policies">Policies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

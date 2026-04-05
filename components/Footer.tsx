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
            <p>The print-on-demand platform trusted by millions of sellers worldwide. Create custom products, connect your store, and start earning.</p>
            <div className="footer__socials">
              <a href="#" className="footer__social">X</a>
              <a href="#" className="footer__social">fb</a>
              <a href="#" className="footer__social">ig</a>
              <a href="#" className="footer__social">yt</a>
            </div>
          </div>
          <div className="footer__col">
            <h4>Connect</h4>
            <a href="#">Shopify</a>
            <a href="#">Etsy</a>
            <a href="#">WooCommerce</a>
            <a href="#">Amazon</a>
            <a href="#">eBay</a>
            <a href="#">TikTok Shop</a>
            <a href="#">Wix</a>
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
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
        <div className="footer__bottom">
          <span>&copy; 2026 Rendall, Inc. All rights reserved.</span>
          <div className="footer__links">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

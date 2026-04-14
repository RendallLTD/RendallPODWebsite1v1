export default function ShippingPage() {
  return (
    <section className="static-page">
      <div className="container static-page__content">
        <h1>Shipping Policy</h1>
        <p><em>Last updated: April 2026</em></p>

        <p>At Rendall POD, we pride ourselves on operating our own production lines to ensure fast and reliable fulfillment for your customers.</p>

        <h2>1. Production Time (Fulfillment)</h2>
        <p>Every item is printed on demand. Standard production time takes 2 to 5 business days after the order is successfully placed and paid for. During peak holiday seasons, production times may be slightly extended, and we will notify you of any delays via the platform dashboard.</p>

        <h2>2. Shipping Times &amp; Methods</h2>
        <p>Shipping times vary depending on the destination country and the shipping method selected at checkout.</p>
        <ul>
          <li><strong>Standard Domestic Shipping (USA):</strong> Typically takes 1-2 business days after production.</li>
          <li><strong>International Shipping:</strong> Typically takes 7-21 business days after production, depending on local customs and postal services.</li>
        </ul>
        <p>Please note that shipping times are estimates, not guarantees.</p>

        <h2>3. Order Tracking</h2>
        <p>Once an order is printed, packed, and handed over to the carrier, a tracking number will automatically be generated. You can view this tracking number in your dashboard, and it will be passed to your connected store (e.g., Shopify) to notify your customer.</p>

        <h2>4. Customs, Duties, and Taxes</h2>
        <p>For international orders, customs fees, tariffs, or import duties may apply upon arrival in the destination country. Rendall is not responsible for these charges. These fees are the sole responsibility of the end-customer. We cannot alter customs declarations or mark items as &ldquo;gifts&rdquo; to avoid taxes.</p>

        <h2>5. Carrier Delays</h2>
        <p>While we strive to ship your orders as fast as possible, we cannot be held responsible for delays caused by the shipping carriers (e.g., severe weather, strikes, customs holds, or high seasonal volume).</p>
        <p>If an order is significantly delayed beyond the estimated delivery window, please contact rendall.ltd@gmail.com so we can investigate the issue.</p>
      </div>
    </section>
  );
}

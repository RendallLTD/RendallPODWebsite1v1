export default function PoliciesPage() {
  return (
    <section className="static-page">
      <div className="container static-page__content">
        <h1>Rendall Policies</h1>
        <p><em>Last updated: April 2026</em></p>

        {/* ── TERMS OF SERVICE ──────────────────────────────────── */}
        <div id="terms" style={{ paddingTop: 32 }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Terms of Service</h2>

          <p>Welcome to Rendall POD. By using our website, platform, and manufacturing services, you agree to comply with the following Terms of Service.</p>

          <h3>1. Account Responsibilities</h3>
          <p>You must be 18 years or older to create an account. You are responsible for maintaining the security of your account and password. Rendall cannot and will not be liable for any loss or damage resulting from your failure to maintain account security.</p>

          <h3>2. Intellectual Property &amp; Content Rules</h3>
          <p>You remain the sole owner of the copyright and intellectual property for all designs you upload to our platform. We do not claim any ownership over your artwork.</p>
          <p>However, by uploading content, you guarantee that:</p>
          <ul>
            <li>You hold the legal rights, licenses, or permissions to reproduce and sell the designs.</li>
            <li>The content does not infringe upon third-party trademarks, copyrights, or intellectual property rights.</li>
            <li>The content is not illegal, hateful, explicit, or abusive.</li>
          </ul>
          <p>We reserve the right to review and cancel any orders or terminate accounts that violate these rules or pose a legal risk to our factory.</p>

          <h3>3. Limitation of Liability</h3>
          <p>Rendall shall not be liable for any indirect, incidental, or consequential damages, including loss of profits, revenue, or data, arising from the use of our platform or delayed production/shipping times.</p>

          <h3>4. Pricing and Modifications</h3>
          <p>We reserve the right to modify product prices, shipping rates, or discontinue specific blank products at any time. We will make reasonable efforts to notify merchants in advance of significant pricing changes.</p>

          <p>By continuing to use our services, you accept these terms in full.</p>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "40px 0" }} />

        {/* ── PRIVACY POLICY ──────────────────────────────────── */}
        <div id="privacy" style={{ paddingTop: 32 }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Privacy Policy</h2>

          <p>At Rendall POD, we are committed to protecting your privacy and ensuring your personal data is handled securely. This Privacy Policy explains how we collect, use, and protect the information of merchants (you) and your end-customers when you use our Print-on-Demand services.</p>

          <h3>1. Information We Collect</h3>
          <p><strong>Merchant Information:</strong> When you register for an account, we collect your name, business name, email address, phone number, and billing information.</p>
          <p><strong>Customer Information:</strong> To fulfill orders, you provide us with your end-customers&apos; details, including their names, shipping addresses, and phone numbers (for delivery purposes only).</p>
          <p><strong>Design &amp; Order Data:</strong> We collect the design files (images/graphics) you upload and the specific order details (product type, size, color) to process your production requests.</p>

          <h3>2. How We Use Your Information</h3>
          <p>We use the collected data exclusively to:</p>
          <ul>
            <li>Produce, fulfill, and ship your orders.</li>
            <li>Process payments securely.</li>
            <li>Communicate with you regarding order statuses, platform updates, and customer support.</li>
            <li>Improve our manufacturing and platform services.</li>
          </ul>

          <h3>3. Data Sharing and Third Parties</h3>
          <p>We do not sell your data or your customers&apos; data to third parties. We only share necessary information with trusted service providers to fulfill our core services. This includes:</p>
          <ul>
            <li>Shipping carriers (e.g., USPS, FedEx, local postal services) to deliver packages.</li>
            <li>Secure payment gateways (e.g., Stripe, PayPal) to process transactions.</li>
          </ul>

          <h3>4. Data Security</h3>
          <p>We implement industry-standard security measures to protect your design files, personal information, and customer data from unauthorized access, alteration, or disclosure.</p>

          <h3>5. Your Rights</h3>
          <p>You have the right to access, update, or delete your account information at any time. If you wish to permanently delete your account and associated data, please contact us at rendall.ltd@gmail.com.</p>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "40px 0" }} />

        {/* ── REFUND POLICY ──────────────────────────────────── */}
        <div id="refund" style={{ paddingTop: 32 }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Refund Policy</h2>

          <p>Because Rendall POD operates as a Print-on-Demand factory, all products are unique and produced made-to-order specifically for your customers. Therefore, we do not support returns or exchanges for buyer&apos;s remorse, wrong size ordered, or wrong color chosen.</p>
          <p>However, we stand behind the quality of our production and offer a comprehensive <strong>30-Day Guarantee</strong> for defective items.</p>

          <h3>1. Damaged or Defective Products</h3>
          <p>If a product arrives defective, damaged, or with a major printing error (e.g., wrong design, poor print quality, incorrect item sent), we will provide a free replacement or a full refund to your account.</p>
          <p><strong>How to claim:</strong> You must submit a support ticket within 30 days of product delivery.</p>
          <p><strong>Evidence required:</strong> You must provide clear photographs showing the defect or damage, along with the order ID.</p>

          <h3>2. Lost in Transit</h3>
          <p>For packages lost in transit, all claims must be submitted no later than 30 days after the estimated delivery date. We will cover the costs of reprinting and shipping a replacement order for you.</p>
          <p>Note: If tracking indicates the package was &ldquo;Delivered,&rdquo; we cannot issue a refund or replacement for stolen packages.</p>

          <h3>3. Invalid Shipping Addresses</h3>
          <p>If you or your customer provides an address that is considered insufficient by the courier, the shipment will be returned to our facility. You will be liable for reshipment costs once we have confirmed an updated address with you.</p>

          <p>To initiate a claim, please contact our support team at rendall.ltd@gmail.com with your Order ID and photographic evidence.</p>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "40px 0" }} />

        {/* ── SHIPPING POLICY ──────────────────────────────────── */}
        <div id="shipping" style={{ paddingTop: 32 }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Shipping Policy</h2>

          <p>At Rendall POD, we pride ourselves on operating our own production lines to ensure fast and reliable fulfillment for your customers.</p>

          <h3>1. Production Time (Fulfillment)</h3>
          <p>Every item is printed on demand. Standard production time takes 2 to 5 business days after the order is successfully placed and paid for. During peak holiday seasons, production times may be slightly extended, and we will notify you of any delays via the platform dashboard.</p>

          <h3>2. Shipping Times &amp; Methods</h3>
          <p>Shipping times vary depending on the destination country and the shipping method selected at checkout.</p>
          <ul>
            <li><strong>Standard Domestic Shipping (USA):</strong> Typically takes 1-2 business days after production.</li>
            <li><strong>International Shipping:</strong> Typically takes 7-21 business days after production, depending on local customs and postal services.</li>
          </ul>
          <p>Please note that shipping times are estimates, not guarantees.</p>

          <h3>3. Order Tracking</h3>
          <p>Once an order is printed, packed, and handed over to the carrier, a tracking number will automatically be generated. You can view this tracking number in your dashboard, and it will be passed to your connected store (e.g., Shopify) to notify your customer.</p>

          <h3>4. Customs, Duties, and Taxes</h3>
          <p>For international orders, customs fees, tariffs, or import duties may apply upon arrival in the destination country. Rendall is not responsible for these charges. These fees are the sole responsibility of the end-customer. We cannot alter customs declarations or mark items as &ldquo;gifts&rdquo; to avoid taxes.</p>

          <h3>5. Carrier Delays</h3>
          <p>While we strive to ship your orders as fast as possible, we cannot be held responsible for delays caused by the shipping carriers (e.g., severe weather, strikes, customs holds, or high seasonal volume).</p>
          <p>If an order is significantly delayed beyond the estimated delivery window, please contact rendall.ltd@gmail.com so we can investigate the issue.</p>
        </div>
      </div>
    </section>
  );
}

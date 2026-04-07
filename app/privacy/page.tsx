export default function PrivacyPage() {
  return (
    <section className="static-page">
      <div className="container static-page__content">
        <h1>Privacy Policy</h1>
        <p><em>Last updated: April 2026</em></p>

        <h2>1. Who We Are</h2>
        <p>Rendall is operated by its parent company based in Hong Kong. We provide a print-on-demand platform that connects customers with our fulfillment partner, UinPOD, which manufactures and ships custom apparel from facilities in China and the United States.</p>

        <h2>2. Information We Collect</h2>
        <p>We collect information you provide when creating an account (name, email, password), placing orders (shipping address, billing details), and using our platform (uploaded designs, product customizations, store connections). Payment card details are collected and processed directly by our payment processor (Stripe) and are never stored on our servers.</p>

        <h2>3. How We Use Your Information</h2>
        <p>We use your information to provide and improve our services, process and fulfill orders, communicate with you about your account, and send relevant updates about our platform.</p>

        <h2>4. Information Sharing</h2>
        <p>We do not sell your personal information. We share information with the following third parties only as necessary to operate our service:</p>
        <ul>
          <li><strong>UinPOD</strong> — our manufacturing and fulfillment partner, to print and ship your orders.</li>
          <li><strong>Stripe</strong> — to process payments securely.</li>
          <li><strong>Supabase</strong> — our database and authentication provider.</li>
          <li><strong>Email and analytics providers</strong> — to deliver transactional emails and improve the platform.</li>
        </ul>
        <p>We may also disclose information if required by law or to protect our legal rights.</p>

        <h2>5. International Data Transfers</h2>
        <p>Because Rendall operates from Hong Kong with fulfillment in China and the United States, your information may be transferred across borders to deliver your orders. We take reasonable measures to ensure your data is protected wherever it is processed.</p>

        <h2>6. Data Security</h2>
        <p>We use industry-standard security measures to protect your data, including encryption in transit, secure authentication through Supabase, and strict access controls on customer records.</p>

        <h2>7. Data Retention</h2>
        <p>We retain account and order information for as long as your account is active or as needed to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion at any time (see Section 9).</p>

        <h2>8. Cookies</h2>
        <p>We use cookies to maintain your session, remember your preferences, and improve your experience. You can disable cookies in your browser settings, though some features may not work correctly without them.</p>

        <h2>9. Your Rights</h2>
        <p>Depending on your location, you may have the right to access, correct, delete, or export your personal information, and to object to or restrict certain processing. Residents of the EU/UK (GDPR) and California (CCPA) have additional rights, including the right to opt out of the sale of personal information — note that we do not sell personal information. To exercise any of these rights, contact us at the address below.</p>

        <h2>10. Children&apos;s Privacy</h2>
        <p>Our services are not intended for children under 18. We do not knowingly collect information from minors.</p>

        <h2>11. Changes to This Policy</h2>
        <p>We may update this policy periodically. We will notify you of significant changes via email or platform notification.</p>

        <h2>12. Contact</h2>
        <p>For privacy inquiries or to exercise your rights, contact us at privacy@rendall.com.</p>
      </div>
    </section>
  );
}

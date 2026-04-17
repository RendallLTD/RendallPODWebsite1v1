import Link from "next/link";

export const metadata = {
  title: "DMCA / Takedown — Rendall",
  description:
    "How to report copyright, trademark, or other intellectual property infringement on Rendall.",
};

export default function DmcaPage() {
  return (
    <section className="static-page">
      <div className="container static-page__content">
        <h1>DMCA / Intellectual Property Takedown</h1>
        <p><em>Last updated: April 2026</em></p>

        <p>
          Rendall Limited (倫德爾有限公司) takes intellectual property rights seriously. We do not tolerate the use of our platform to reproduce content that infringes on the copyright, trademark, or other IP rights of third parties. Every merchant agrees in our <Link href="/terms">Terms of Service</Link> that they hold the necessary rights to every design they upload.
        </p>

        <p>
          If you believe content hosted, printed, or sold via Rendall infringes your rights, please send us a notice and we will investigate promptly.
        </p>

        <h2>1. How to submit a takedown notice</h2>
        <p>
          Send an email to <a href="mailto:support@rendallpod.com">support@rendallpod.com</a> with the subject line <strong>&ldquo;Takedown Request&rdquo;</strong>. Your notice must include all of the following:
        </p>
        <ol>
          <li>Your full legal name, postal address, telephone number, and email address.</li>
          <li>A clear description of the copyrighted work, trademark, or other IP right you claim has been infringed (including registration numbers where applicable).</li>
          <li>The exact URL(s) on rendallpod.com where the infringing content appears, or the order ID / product listing ID if you are reporting a sold item.</li>
          <li>A statement that you have a good-faith belief that the use of the material is not authorized by the rights holder, its agent, or the law.</li>
          <li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the rights holder or are authorized to act on the rights holder&apos;s behalf.</li>
          <li>Your physical or electronic signature.</li>
        </ol>
        <p>
          Notices missing any of the above may be returned for completion before we can act.
        </p>

        <h2>2. What we do when we receive a valid notice</h2>
        <ul>
          <li>We acknowledge receipt within <strong>2 business days</strong>.</li>
          <li>We remove or disable access to the reported material expeditiously, typically within <strong>5 business days</strong> of receiving a complete notice.</li>
          <li>We notify the merchant who uploaded the material and provide them with a copy of the notice.</li>
          <li>We may suspend or terminate the accounts of merchants who are the subject of repeated, valid infringement notices.</li>
        </ul>

        <h2>3. Counter-notice</h2>
        <p>
          If you are a merchant whose content has been removed and you believe the removal was the result of a mistake or misidentification, you may submit a counter-notice to <a href="mailto:support@rendallpod.com">support@rendallpod.com</a>. Your counter-notice must include:
        </p>
        <ol>
          <li>Your full legal name, postal address, telephone number, and email address.</li>
          <li>Identification of the material that was removed and the location it appeared at before removal.</li>
          <li>A statement, under penalty of perjury, that you have a good-faith belief the material was removed as a result of mistake or misidentification.</li>
          <li>A statement consenting to the jurisdiction of the courts of Hong Kong SAR for any dispute arising from the notice.</li>
          <li>Your physical or electronic signature.</li>
        </ol>

        <h2>4. False claims</h2>
        <p>
          Submitting a knowingly false takedown notice or counter-notice may make you liable for damages, including costs and attorneys&apos; fees, under applicable law.
        </p>

        <h2>5. Designated contact</h2>
        <p>
          All IP-related correspondence should be sent to:
        </p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:support@rendallpod.com">support@rendallpod.com</a></li>
          <li><strong>Entity:</strong> Rendall Limited (倫德爾有限公司)</li>
          <li><strong>Registered office:</strong> Flat B53, 2/F, Phase 1, Kwai Shing Industrial Centre, 36-40 Tai Lin Pai Road, Kwai Chung, NT, Hong Kong</li>
          <li><strong>Companies Registry No.:</strong> 80142539</li>
        </ul>
      </div>
    </section>
  );
}

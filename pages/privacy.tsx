import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';

export default function Privacy() {
  return (
    <div className="page-container flex flex-col">
      <Head>
        <title>Privacy Statement | Pinkaroo</title>
        <meta name="description" content="Pinkaroo privacy statement and how we collect, use, and protect your information." />
      </Head>
      <Header />
      <main className="flex-1 content-width py-10 pb-14">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Statement</h1>
        <p className="text-slate-600 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">1. Introduction</h2>
            <p>
              Pinkaroo (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Statement explains how we collect, use, disclose, and safeguard your information when you use our real estate portal and related services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">2. Information We Collect</h2>
            <p>We may collect information that you provide directly, including:</p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>Name, email address, and contact details when you register or contact us</li>
              <li>Account credentials and profile information</li>
              <li>Preferences such as saved favourites (listings) and search criteria</li>
              <li>Communications with realtors, brokers, or our team</li>
            </ul>
            <p className="mt-2">
              We also collect certain information automatically when you use our services, such as device and browser information, IP address, and usage data (e.g., pages viewed, listings viewed).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience (e.g., favourites, recently viewed listings)</li>
              <li>Communicate with you about listings, inquiries, and account-related matters</li>
              <li>Comply with legal obligations and protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">4. Sharing and Disclosure</h2>
            <p>
              We may share your information with realtors, brokers, or listing agents when you express interest in a property or use features that involve them. We do not sell your personal information to third parties. We may disclose information where required by law or to protect our rights and safety.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">5. Security and Retention</h2>
            <p>
              We use reasonable technical and organizational measures to protect your personal information. We retain your information for as long as necessary to provide our services and to comply with legal and regulatory requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">6. Your Choices</h2>
            <p>
              You may update your profile, manage your favourites, and control certain preferences through your account. You may contact us to request access to, correction of, or deletion of your personal information, subject to applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">7. Contact Us</h2>
            <p>
              If you have questions about this Privacy Statement or our practices, please contact us through the contact information provided on our website or in your account settings.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-accent-600 font-semibold hover:underline">
            &larr; Back to home
          </Link>
          <Link href="/terms" className="text-accent-600 font-semibold hover:underline">
            Terms of Use
          </Link>
          <Link href="/cookie-policy" className="text-accent-600 font-semibold hover:underline">
            Cookie Policy
          </Link>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

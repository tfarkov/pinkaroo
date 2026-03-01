import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';

export default function CookiePolicy() {
  return (
    <div className="page-container flex flex-col">
      <Head>
        <title>Cookie Policy | Pinkaroo</title>
        <meta name="description" content="Learn how Pinkaroo uses cookies and similar technologies on our real estate portal." />
      </Head>
      <Header />
      <main className="flex-1 content-width py-10 pb-14">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Cookie Policy</h1>
        <p className="text-slate-600 text-sm mb-8">Last updated: February 15, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device (computer, tablet, or smartphone) when you
              visit a website. They are widely used to make websites work more efficiently, provide a better
              browsing experience, and give site owners information about how their site is used.
            </p>
            <p className="mt-2">
              In addition to cookies, we may also use similar tracking technologies such as web beacons, pixel tags,
              and local storage. In this policy, we use the term &quot;cookies&quot; to refer to all such
              technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">2. How We Use Cookies</h2>
            <p>Pinkaroo uses cookies to:</p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>Keep you signed in to your account across pages and sessions</li>
              <li>Remember your preferences, such as saved filters, recently viewed listings, and unit settings</li>
              <li>Understand how visitors use our Platform so we can improve it (analytics)</li>
              <li>Protect the Platform from fraud and unauthorized access (security cookies)</li>
              <li>Enable essential functionality such as map rendering and geolocation features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">3. Types of Cookies We Use</h2>

            <div className="mt-4 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-1">Strictly Necessary Cookies</h3>
                <p className="text-sm">
                  These cookies are essential for the Platform to function and cannot be switched off. They include
                  session authentication tokens and security cookies. Without them, you would not be able to sign in
                  or use core features of the Platform.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-1">Functional Cookies</h3>
                <p className="text-sm">
                  These cookies allow the Platform to remember choices you make, such as your preferred unit of
                  measurement, recently viewed listings, and map zoom level. They provide a more personalized
                  experience but are not essential to basic functionality.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-1">Analytics Cookies</h3>
                <p className="text-sm">
                  These cookies help us understand how visitors interact with our Platform by collecting anonymous
                  usage statistics, such as which pages are visited most often and how users navigate the site. This
                  helps us improve our services. We may use third-party analytics services for this purpose.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-1">Third-Party Cookies</h3>
                <p className="text-sm">
                  Some features of our Platform use third-party services, such as map providers, which may set their
                  own cookies. These third-party cookies are subject to the privacy and cookie policies of those
                  providers. We do not control how these cookies are set or used.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">4. Session vs. Persistent Cookies</h2>
            <p>
              <strong>Session cookies</strong> are temporary and are deleted from your device when you close your
              browser. They are used to maintain your session while you navigate the Platform.
            </p>
            <p className="mt-2">
              <strong>Persistent cookies</strong> remain on your device for a set period of time (or until you
              delete them) and are activated each time you visit the Platform. We use persistent cookies to remember
              your preferences between visits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">5. Managing and Disabling Cookies</h2>
            <p>
              Most web browsers allow you to control cookies through their settings. You can typically:
            </p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>View the cookies stored on your device</li>
              <li>Delete some or all cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies from being set</li>
            </ul>
            <p className="mt-2">
              Please note that disabling certain cookies may affect the functionality of the Platform. In particular,
              disabling strictly necessary cookies will prevent you from signing in or using key features.
            </p>
            <p className="mt-2">
              For more information on how to manage cookies in your browser, visit your browser&apos;s help pages:
            </p>
            <ul className="list-disc pl-6 my-2 space-y-1 text-sm">
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/en-ca/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">
                  Apple Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy" target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">6. Cookies and Personal Information</h2>
            <p>
              Some cookies may collect personal information such as your IP address or browsing behaviour. This
              information is handled in accordance with our{' '}
              <Link href="/privacy" className="text-accent-600 hover:underline">Privacy Statement</Link>.
              We do not use cookies to collect sensitive personal information such as financial or health data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or
              our practices. When we make material changes, we will update the &quot;Last updated&quot; date at the
              top of this page. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">8. Contact Us</h2>
            <p>If you have any questions about our use of cookies, please contact us:</p>
            <address className="not-italic mt-2 space-y-1 text-slate-700">
              <p><strong>Pinkaroo Real Estate Inc.</strong></p>
              <p>Toronto, Ontario, Canada</p>
              <p>
                Email:{' '}
                <a href="mailto:legal@pinkaroo.ca" className="text-accent-600 hover:underline">
                  legal@pinkaroo.ca
                </a>
              </p>
            </address>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-accent-600 font-semibold hover:underline">
            &larr; Back to home
          </Link>
          <Link href="/privacy" className="text-accent-600 font-semibold hover:underline">
            Privacy Statement
          </Link>
          <Link href="/terms" className="text-accent-600 font-semibold hover:underline">
            Terms of Use
          </Link>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

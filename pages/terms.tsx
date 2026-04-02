import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';
import { SEO, canonicalUrl, toAbsoluteUrl } from '../lib/seo';

export default function Terms() {
  const title = 'Terms of Use | Pinkaroo';
  const description = 'Pinkaroo Terms of Use governing your use of our real estate portal.';
  const canonical = canonicalUrl('/terms');
  const ogImage = toAbsoluteUrl(SEO.ogImagePath);

  return (
    <div className="page-container flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={SEO.siteName} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Head>
      <Header />
      <main className="flex-1 content-width py-10 pb-14">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Use</h1>
        <p className="text-slate-600 text-sm mb-8">Last updated: February 15, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              These Terms of Use govern your access to and use of the Pinkaroo website, mobile application, and
              related services (the &quot;Platform&quot;) operated by Pinkaroo Real Estate Inc. (&quot;Pinkaroo&quot;,
              &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
            </p>
            <p className="mt-2">
              By accessing or using the Platform, you agree to be bound by these Terms and our{' '}
              <Link href="/privacy" className="text-accent-600 hover:underline">Privacy Statement</Link>{' '}
              and{' '}
              <Link href="/cookie-policy" className="text-accent-600 hover:underline">Cookie Policy</Link>.
              If you do not agree, please do not use the Platform.
            </p>
            <p className="mt-2">
              These Terms may be updated from time to time. Continued use of the Platform after changes are posted
              constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">2. Description of Services</h2>
            <p>
              Pinkaroo is an online real estate portal that allows users to search property listings, connect with
              registered realtors and brokers, save favourite properties, receive personalized recommendations, and
              access related real estate tools and features including eco-ratings and MLS-sourced listing data.
            </p>
            <p className="mt-2">
              Pinkaroo is not a licensed real estate brokerage unless explicitly stated. Use of the Platform does not
              constitute a professional real estate advisory relationship. All transactions involving the purchase or
              sale of real property must be conducted through a licensed real estate professional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">3. Eligibility and User Accounts</h2>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>You must be at least 18 years of age to create an account or use the Platform.</li>
              <li>You agree to provide accurate, current, and complete information when registering and to keep your account information up to date.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</li>
              <li>You must notify us immediately if you suspect unauthorized use of your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms, are inactive, or are used for fraudulent purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">4. Permitted Use</h2>
            <p>The Platform is provided for your personal, non-commercial use. You may use the Platform to:</p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>Browse, search, and save property listings for personal real estate research</li>
              <li>Contact registered realtors and brokers through the Platform messaging features</li>
              <li>View listing details, eco-ratings, and neighbourhood information</li>
              <li>Create and manage a personal profile and preferences</li>
            </ul>
            <p className="mt-3 font-semibold text-slate-800">You agree NOT to:</p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>Copy, scrape, harvest, or systematically download listing data or any content from the Platform</li>
              <li>Use automated bots, scrapers, crawlers, or similar tools to access the Platform</li>
              <li>Reproduce, republish, redistribute, or resell any content from the Platform without prior written consent</li>
              <li>Use the Platform for any unlawful, fraudulent, or harmful purpose</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity</li>
              <li>Post or transmit unsolicited commercial messages, spam, or advertising</li>
              <li>Attempt to gain unauthorized access to any part of the Platform or its underlying systems</li>
              <li>Interfere with or disrupt the integrity or performance of the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">5. Listing Data and MLS Information</h2>
            <p>
              Some listing data displayed on the Platform may be sourced from the Multiple Listing Service (MLS)
              system operated by authorized real estate boards and associations. The trademarks MLS, Multiple Listing
              Service, and the associated logos are owned by The Canadian Real Estate Association (CREA).
            </p>
            <p className="mt-2">
              Listing information is provided in good faith and is believed to be accurate, but is not guaranteed.
              Pinkaroo makes no representations or warranties regarding the completeness, accuracy, currency, or
              suitability of any listing data. You should independently verify all information before making any
              real estate decision.
            </p>
            <p className="mt-2">
              Listing data is intended for the private, non-commercial use of individuals who are potential purchasers
              or sellers of real property. Any other use requires the prior written consent of Pinkaroo and the
              applicable MLS body.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">6. Eco-Rating Disclaimer</h2>
            <p>
              Pinkaroo provides an Eco-Rating for certain listings as a general informational tool. The Eco-Rating is
              a calculated estimate based on available property data such as property age, heating type, insulation,
              roof age, and appliance age, and is intended solely for informational purposes.
            </p>
            <p className="mt-2">
              The Eco-Rating does not constitute a professional environmental assessment, energy audit, or
              certification. It should not be relied upon as an accurate measure of a property energy efficiency or
              environmental impact. Buyers are encouraged to obtain a certified energy audit from a qualified
              professional before making any purchasing decision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">7. Messaging and Communications</h2>
            <p>
              The Platform includes messaging features that allow users to communicate with realtors, brokers, and
              administrative staff. By using these features, you agree to:
            </p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>Use messaging only for lawful, legitimate real estate inquiries and communications</li>
              <li>Not send harassing, abusive, defamatory, obscene, or threatening messages</li>
              <li>Not transmit viruses, malware, or any code that could harm the Platform or other users</li>
              <li>Not send unsolicited commercial communications or spam</li>
              <li>Not share sensitive personal data such as financial account numbers, SIN, passport numbers, or passwords through the messaging system</li>
            </ul>
            <p className="mt-2">
              Pinkaroo reserves the right but not the obligation to monitor, review, and remove messages at our
              discretion, including to comply with applicable law or government requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">8. Realtor and Broker Accounts</h2>
            <p>Realtors and brokers who register on the Platform represent and warrant that:</p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>They hold a valid real estate licence in the applicable Canadian province or territory</li>
              <li>All listing information they submit is accurate, current, and compliant with applicable real estate board rules and regulations</li>
              <li>They have the authority to list the properties they submit to the Platform</li>
              <li>They will comply with all applicable real estate regulations, codes of conduct, and advertising standards</li>
            </ul>
            <p className="mt-2">
              Pinkaroo reserves the right to verify credentials and to suspend or remove any realtor or broker account
              that fails to meet these standards or that receives substantiated complaints.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">9. Intellectual Property</h2>
            <p>
              All content on the Platform, including but not limited to text, images, graphics, logos, user interface
              design, software, and data compilations, is the property of Pinkaroo or its licensors and is protected
              by applicable Canadian and international copyright, trademark, and intellectual property laws.
            </p>
            <p className="mt-2">
              You are granted a limited, non-exclusive, non-transferable, revocable licence to access and use the
              Platform for your personal, non-commercial purposes. No other licence is granted. Nothing in these Terms
              transfers any ownership rights to you.
            </p>
            <p className="mt-2">
              &quot;Pinkaroo&quot; and the Pinkaroo logo are trademarks of Pinkaroo Real Estate Inc. You may not use
              our trademarks without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">10. Third-Party Links and Services</h2>
            <p>
              The Platform may contain links to third-party websites, services, or resources. These links are provided
              for your convenience only. Pinkaroo does not endorse or control third-party sites and is not responsible
              for their content, accuracy, privacy practices, or any damages arising from your use of them.
            </p>
            <p className="mt-2">
              Map data and certain geolocation features may be provided by third-party providers such as mapping
              services. Your use of these features is also subject to the terms and privacy policies of those providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">11. Disclaimer of Warranties</h2>
            <p className="text-sm font-semibold text-slate-600">
              THE PLATFORM IS PROVIDED AS IS AND AS AVAILABLE WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-2">
              Pinkaroo does not warrant that the Platform will be uninterrupted, error-free, or free of viruses or
              other harmful components. We do not warrant the accuracy, completeness, or timeliness of any listing
              data, eco-ratings, or other content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">12. Limitation of Liability</h2>
            <p className="text-sm font-semibold text-slate-600">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PINKAROO AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
              AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF, OR INABILITY TO USE, THE PLATFORM OR ITS
              CONTENT.
            </p>
            <p className="mt-2">
              In no event shall our total liability to you for any claims arising from or related to the Platform
              exceed the greater of (a) the amount you paid to Pinkaroo (if any) in the 12 months preceding the
              claim, or (b) one hundred Canadian dollars (CAD $100).
            </p>
            <p className="mt-2">
              Some jurisdictions do not allow the exclusion or limitation of liability for certain damages, so the
              above limitations may not apply to you in full.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">13. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Pinkaroo and its officers, directors, employees, and
              agents from and against any claims, liabilities, damages, losses, and expenses including reasonable
              legal fees arising out of or in any way connected with your access to or use of the Platform, your
              violation of these Terms, or your violation of any rights of any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">14. Privacy</h2>
            <p>
              Your use of the Platform is also governed by our{' '}
              <Link href="/privacy" className="text-accent-600 hover:underline">Privacy Statement</Link>,
              which is incorporated into these Terms by reference. By using the Platform, you consent to the
              collection and use of your information as described in the Privacy Statement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">15. Modifications to the Platform</h2>
            <p>
              Pinkaroo reserves the right to modify, suspend, or discontinue the Platform or any part of it at any
              time, with or without notice. We will not be liable to you or any third party for any such modification,
              suspension, or discontinuation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">16. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Province of Ontario and
              the federal laws of Canada applicable therein, without regard to conflict of law principles.
            </p>
            <p className="mt-2">
              Any dispute arising from these Terms or your use of the Platform shall first be addressed through
              good-faith negotiation. If unresolved, disputes shall be submitted to the exclusive jurisdiction of the
              courts of Ontario, Canada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">17. Severability</h2>
            <p>
              If any provision of these Terms is found to be unlawful, void, or unenforceable, that provision will be
              deemed severable from these Terms and will not affect the validity and enforceability of the remaining
              provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">18. Contact Us</h2>
            <p>If you have any questions about these Terms of Use, please contact us:</p>
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

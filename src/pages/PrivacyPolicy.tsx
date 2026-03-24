import { APP_CONFIG } from '../config/appConfig';

export default function PrivacyPolicy() {
  const appName = APP_CONFIG.app.name;
  return (
    <div className="max-w-3xl mx-auto py-8 text-gray-300 space-y-6">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: March 2026</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Overview</h2>
        <p>
          {appName} is a free brain training and mental math practice application.
          We are committed to protecting your privacy. This policy explains what data
          we collect and how we use it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Data We Collect</h2>
        <p>
          <strong className="text-white">We do not collect any personal data.</strong>{' '}
          This app does not require signup, login, or any form of registration.
          We do not use cookies, localStorage, or any form of data persistence.
          All game progress exists only in your browser's memory during your session
          and is lost when you close the tab.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Third-Party Services</h2>
        <p>We may use the following third-party services:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong className="text-white">Google AdSense:</strong> Displays advertisements.
            Google may use cookies to serve ads based on your prior visits. You can opt out
            at{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Ad Settings
            </a>.
          </li>
          <li>
            <strong className="text-white">Google Fonts:</strong> We load fonts from
            Google's CDN. Google's privacy policy applies to this service.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Advertising</h2>
        <p>
          Third-party vendors, including Google, use cookies to serve ads based on
          your prior visits to this or other websites. Google's use of advertising
          cookies enables it and its partners to serve ads based on your visit to
          this site and/or other sites on the Internet. You may opt out of
          personalized advertising by visiting{' '}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google Ad Settings
          </a>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Children's Privacy</h2>
        <p>
          This app is designed for users of all ages for educational purposes. We do
          not knowingly collect personal information from children. Since the app
          collects no personal data at all, it is safe for users of any age.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Changes</h2>
        <p>
          We may update this policy from time to time. Any changes will be reflected
          on this page with an updated date.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Contact</h2>
        <p>
          If you have questions about this privacy policy, please open an issue on
          our GitHub repository.
        </p>
      </section>
    </div>
  );
}

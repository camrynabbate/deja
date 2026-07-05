export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <a href="/" className="font-serif text-2xl font-semibold text-foreground tracking-tight">
            deja
          </a>
          <a
            href="/about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <h1 className="font-serif text-4xl font-semibold text-foreground">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground">Last updated: July 5, 2026</p>

        <section className="space-y-3">
          <h2 className="font-medium text-foreground text-lg">Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you create an account, we collect your email address and password (stored securely via Firebase Authentication).
            We also store items you like or save, styleboards you create, and basic product interactions used to personalize your experience.
            If you use photo search, the selected image is sent securely to our image-analysis provider to identify the item.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-foreground text-lg">How We Use Your Information</h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc list-inside">
            <li>To provide and maintain the deja platform</li>
            <li>To personalize your product feed and recommendations</li>
            <li>To improve our service and user experience</li>
            <li>To communicate with you about your account</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-foreground text-lg">Third-Party Services</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use the following third-party services:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc list-inside">
            <li><strong className="text-foreground">Firebase</strong> — Authentication and private app data storage</li>
            <li><strong className="text-foreground">Algolia</strong> — Product search</li>
            <li><strong className="text-foreground">Anthropic</strong> — Photo analysis when you choose photo search</li>
            <li><strong className="text-foreground">Sentry</strong> — App crash reports, when enabled, without email addresses or screen recordings</li>
            <li><strong className="text-foreground">Affiliate Networks</strong> — Product links may direct you to retailer websites; tracking is enabled only after permission where required</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-foreground text-lg">Cookies & Local Storage</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Likes, saved items, and styleboards are stored securely with your account.
            Recently viewed products are stored only on your device and are kept separate for each account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-foreground text-lg">Data Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your data is protected using industry-standard security measures provided by Firebase and Google Cloud.
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-foreground text-lg">Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can delete your account and associated data at any time from your profile settings.
            For any privacy-related requests, contact us at{' '}
            <a href="mailto:hello@bedeja.com" className="text-foreground underline underline-offset-4 hover:text-accent transition-colors">
              hello@bedeja.com
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-foreground text-lg">Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} deja. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

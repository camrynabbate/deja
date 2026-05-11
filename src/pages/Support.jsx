export default function Support() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <a href="/" className="font-serif text-2xl font-semibold text-foreground tracking-tight">
            deja
          </a>
          <a
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        <section className="space-y-4">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-tight">
            Help &amp; Support
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            We're a small team. The fastest way to get help is to email us — we read every message.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Contact us</h2>
          <p className="text-muted-foreground leading-relaxed">
            Email{' '}
            <a href="mailto:hello@bedeja.com" className="text-foreground underline underline-offset-4 hover:text-accent transition-colors">
              hello@bedeja.com
            </a>{' '}
            for help, bug reports, partnership inquiries, or feedback. We typically reply within a couple of business days.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Common questions</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="font-medium text-foreground">How do I save items?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                On any product in the feed, tap the bookmark icon to save it. Saved items live in the Saved tab. Tap the heart icon to like instead — likes also count toward your taste profile but are organized separately.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">How do styleboards work?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Go to Styleboards and create a new board. Drag items from your saved + liked panel onto the canvas to plan outfits and looks. Boards save automatically.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">What is Find Dupes?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Find Dupes lets you upload or photograph an item you like and surfaces similar pieces from brands in our catalog at different price points.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">I tapped "Shop" but the link didn't work.</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Some retailer pages occasionally go offline or remove items. If a link is broken, please email us with the item title so we can update or remove it.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">How do I delete my account?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Open the Profile tab, scroll to the bottom, and tap "Delete Account." This permanently removes your account, preferences, saved items, styleboards, and search history. If you only want to clear data without deleting the account, use "Clear All Data" instead.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">Why does my feed look different each visit?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The feed is intentionally varied so you discover new pieces. As you like, save, and skip items, your feed becomes more personal over time.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Privacy &amp; data</h2>
          <p className="text-muted-foreground leading-relaxed">
            See our{' '}
            <a href="/privacy" className="text-foreground underline underline-offset-4 hover:text-accent transition-colors">
              Privacy Policy
            </a>{' '}
            for details on what we collect and how it's used. To request a copy or deletion of your data, email{' '}
            <a href="mailto:hello@bedeja.com" className="text-foreground underline underline-offset-4 hover:text-accent transition-colors">
              hello@bedeja.com
            </a>.
          </p>
        </section>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} deja. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/support" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

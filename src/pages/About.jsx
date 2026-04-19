export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Hero */}
        <section className="space-y-4">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-tight">
            Your personal style, curated.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            deja is a fashion discovery platform that helps you find pieces you'll love from brands you trust.
            We curate real products from top retailers and surface styles tailored to your taste.
          </p>
        </section>

        {/* What We Do */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-foreground">What we do</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Curated Feed</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse a handpicked selection of clothing, shoes, and accessories from real retailers — updated regularly.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Save & Organize</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Like items, save them to your collection, and build styleboards to plan outfits and looks.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Shop Direct</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every item links directly to the retailer's website so you can purchase with confidence.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-foreground">How it works</h2>
          <ol className="space-y-3 text-muted-foreground leading-relaxed">
            <li className="flex gap-3">
              <span className="font-medium text-foreground shrink-0">1.</span>
              Create a free account and tell us your style preferences.
            </li>
            <li className="flex gap-3">
              <span className="font-medium text-foreground shrink-0">2.</span>
              Browse your personalized feed of real products from top fashion brands.
            </li>
            <li className="flex gap-3">
              <span className="font-medium text-foreground shrink-0">3.</span>
              Like, save, and organize the pieces that catch your eye.
            </li>
            <li className="flex gap-3">
              <span className="font-medium text-foreground shrink-0">4.</span>
              Click through to shop directly from the retailer when you're ready to buy.
            </li>
          </ol>
        </section>

        {/* Affiliate Disclosure */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Affiliate disclosure</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            deja participates in affiliate marketing programs. When you click a product link and make a purchase,
            we may earn a small commission at no additional cost to you. This helps us keep the platform free
            and continue curating great finds for our community.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions or feedback? Reach us at{' '}
            <a href="mailto:hello@bedeja.com" className="text-foreground underline underline-offset-4 hover:text-accent transition-colors">
              hello@bedeja.com
            </a>
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

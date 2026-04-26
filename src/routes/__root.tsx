import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-[430px] text-center">
        <h1 className="text-7xl font-bold text-gradient-emerald">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { title: "WinamGames — Play. Win. Repeat." },
      { name: "description", content: "Play puzzle games, earn draw tickets, and win cash prizes weekly on WinamGames." },
      { name: "author", content: "WinamGames" },
      { property: "og:title", content: "WinamGames — Play. Win. Repeat." },
      { property: "og:description", content: "Play puzzle games, earn draw tickets, and win cash prizes weekly on WinamGames." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#1a1a2e" },
      { name: "twitter:title", content: "WinamGames — Play. Win. Repeat." },
      { name: "twitter:description", content: "Play puzzle games, earn draw tickets, and win cash prizes weekly on WinamGames." },
      { property: "og:image", content: "https://winamgames.lovable.app/winam-logo.png" },
      { name: "twitter:image", content: "https://winamgames.lovable.app/winam-logo.png" },
    ],
    links: [
      { rel: "icon", href: "/winam-logo.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
    const stored = localStorage.getItem('winam-theme');
    if (stored === 'light') {
      document.documentElement.classList.add('light');
    } else if (stored === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('light');
      }
    }
  })();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}

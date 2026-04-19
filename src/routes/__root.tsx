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
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: "#1a1a2e" },
      { name: "twitter:title", content: "WinamGames — Play. Win. Repeat." },
      { name: "twitter:description", content: "Play puzzle games, earn draw tickets, and win cash prizes weekly on WinamGames." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/308d7830-456a-4202-a5a3-e3e18588c781/id-preview-4d579e4c--9ee1b722-4e37-43e6-9a75-6523c019db5f.lovable.app-1776513400329.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/308d7830-456a-4202-a5a3-e3e18588c781/id-preview-4d579e4c--9ee1b722-4e37-43e6-9a75-6523c019db5f.lovable.app-1776513400329.png" },
    ],
    links: [
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

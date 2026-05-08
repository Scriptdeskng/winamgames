import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-family-display",
  weight: ["400", "500", "600", "700", "800"],
});

const interBody = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-family-body",
  weight: ["400", "500", "600", "700", "800"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-family-mono",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "WinamGames — Play. Win. Repeat.",
  description: "Play puzzle games, earn draw tickets, and win cash prizes weekly on WinamGames.",
  authors: [{ name: "WinamGames" }],
  openGraph: {
    title: "WinamGames — Play. Win. Repeat.",
    description: "Play puzzle games, earn draw tickets, and win cash prizes weekly on WinamGames.",
    type: "website",
    images: ["https://winamgames.lovable.app/winam-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "WinamGames — Play. Win. Repeat.",
    description: "Play puzzle games, earn draw tickets, and win cash prizes weekly on WinamGames.",
    images: ["https://winamgames.lovable.app/winam-logo.png"],
  },
  icons: [{ rel: "icon", url: "/winam-logo.png" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
  <html lang="en" className={`dark ${inter.variable} ${interBody.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
  const root = document.documentElement;
  if (window.location.pathname.startsWith('/admin')) {
    root.classList.remove('light');
    root.classList.add('dark');
    return;
  }
  const stored = localStorage.getItem('winam-theme');
  if (stored === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://use.typekit.net" />

        {/* External Scripts */}
        <script
          src="https://unpkg.com/splitting/dist/splitting.min.js"
          async
          defer
        ></script>
        <script
          src="https://unpkg.com/gsap@3.11.5/dist/gsap.min.js"
          async
          defer
        ></script>

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://embedsocial.com" />
        <link rel="dns-prefetch" href="https://use.typekit.net" />

        {/* Meta tags for better performance */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />

        {/* Favicon links for consistent display across all browsers and platforms */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          href="/icons/favicon-16x16.png"
          type="image/png"
          sizes="16x16"
        />
        <link
          rel="icon"
          href="/icons/favicon-32x32.png"
          type="image/png"
          sizes="32x32"
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
        {/* Load Typekit stylesheet after the main content */}
        <link rel="stylesheet" href="https://use.typekit.net/qhm2ggg.css" />
      </body>
    </Html>
  );
}

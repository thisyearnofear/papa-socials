import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="stylesheet" href="https://use.typekit.net/qhm2ggg.css" />
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
      </body>
    </Html>
  );
}

import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="stylesheet" href="https://use.typekit.net/qhm2ggg.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <Script
          src="https://unpkg.com/splitting/dist/splitting.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://unpkg.com/gsap@3.11.5/dist/gsap.min.js"
          strategy="beforeInteractive"
        />
      </body>
    </Html>
  );
}

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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

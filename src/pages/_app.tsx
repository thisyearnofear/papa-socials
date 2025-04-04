import "@/styles/globals.css";
import "../../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://use.typekit.net/qhm2ggg.css" />
      </Head>
      <Script
        src="https://unpkg.com/splitting/dist/splitting.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://unpkg.com/gsap@3.11.5/dist/gsap.min.js"
        strategy="beforeInteractive"
      />
      <Component {...pageProps} />
    </>
  );
}

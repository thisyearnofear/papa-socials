import "@/styles/globals.css";
import "../../styles/globals.css";
import "../../styles/discography.css";
import "../../styles/band.css";
import "../../styles/events.css";
import "../../styles/music.css";
import "../../styles/social.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://use.typekit.net/qhm2ggg.css" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

import "../styles/globals.css";
import "../styles/discography.css";
import "../styles/band.css";
import "../styles/events.css";
import "../styles/music.css";
import "../styles/slides.css";
import "../styles/social.css";
import "../styles/filecoin.css";
import "../styles/archive.css";
import "../styles/delegation.css";
import "../styles/terminal.css";
import "../styles/verification.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { FilecoinProvider } from "../contexts/filecoin-context";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <FilecoinProvider>
        <Component {...pageProps} />
      </FilecoinProvider>
    </>
  );
}

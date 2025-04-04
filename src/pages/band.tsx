import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation } from "../../hooks/useClipAnimation";
import React from "react";

export default function BandPage() {
  const { clipRef, clipImageRef, slidesRef, titleRef, toggleEffect } =
    useClipAnimation();

  return (
    <>
      <Head>
        <title>PAPA | The Band</title>
        <meta
          name="description"
          content="Meet the talented musicians who collaborate with PAPA to create the unique sound that blends afro inspired gospel, latino rhythms, and European influences."
        />
        <meta
          name="keywords"
          content="PAPA, band members, musicians, collaborators, afro gospel, latino rhythms, music artists"
        />
      </Head>

      <Layout>
        <div className="slides" ref={slidesRef}>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo4/2.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo4/3.jpg)" }}
            ></div>
          </div>
          <div className="slide slide--current">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo4/1.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo4/4.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo4/5.jpg)" }}
            ></div>
          </div>
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ backgroundImage: "url(/img/demo4/1.jpg)" }}
          ></div>
        </div>

        <div className="cover">
          <h2 className="cover__title" ref={titleRef} data-splitting>
            The Band
          </h2>
          <p className="cover__description">
            Over the years there have been over 50 different people that have
            come in and out of the band: &ldquo;the Jim Jams&rdquo;. A dash of
            drums here, a pinch of horn there, tablespoon of boiling Memphis
            guitar sprinkled in.
          </p>
          <button className="cover__button unbutton" onClick={toggleEffect}>
            Meet The Band
          </button>
        </div>
      </Layout>
    </>
  );
}

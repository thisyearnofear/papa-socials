import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation } from "../../hooks/useClipAnimation";
import SocialLinks from "../../components/SocialLinks";
import React, { useState } from "react";

export default function SocialPage() {
  const { clipRef, clipImageRef, slidesRef, titleRef, toggleEffect } =
    useClipAnimation();
  const [isAnimated, setIsAnimated] = useState(false);

  const handleToggleEffect = () => {
    setIsAnimated(!isAnimated);
    toggleEffect();
  };

  return (
    <>
      <Head>
        <title>PAPA | Connect</title>
        <meta
          name="description"
          content="Connect with PAPA across social media platforms and join the community for exclusive updates and content."
        />
        <meta
          name="keywords"
          content="PAPA, social media, connect, community, music artist"
        />
      </Head>

      <Layout>
        <div className="slides" ref={slidesRef}>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo2/2.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo2/3.jpg)" }}
            ></div>
          </div>
          <div className="slide slide--current">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo2/1.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo2/4.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo2/5.jpg)" }}
            ></div>
          </div>
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ backgroundImage: "url(/img/demo2/1.jpg)" }}
          ></div>
        </div>

        <div className="cover">
          <h2 className="cover__title" ref={titleRef} data-splitting>
            Connect
          </h2>
          <p className="cover__description">
            Join PAPA&apos;s community and stay connected across platforms.
          </p>

          <div
            className={`social-container ${isAnimated ? "is-animated" : ""}`}
          >
            <SocialLinks />
          </div>

          <button
            className="cover__button unbutton"
            onClick={handleToggleEffect}
          >
            {isAnimated ? "Close" : "Connect Now"}
          </button>
        </div>
      </Layout>
    </>
  );
}

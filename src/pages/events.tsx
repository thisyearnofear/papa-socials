import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation } from "../../hooks/useClipAnimation";
import React from "react";

export default function EventsPage() {
  const { clipRef, clipImageRef, slidesRef, titleRef, toggleEffect } =
    useClipAnimation();

  return (
    <>
      <Head>
        <title>PAPA | Upcoming Events</title>
        <meta
          name="description"
          content="Check out PAPA's upcoming performances, concerts, and festival appearances."
        />
        <meta
          name="keywords"
          content="PAPA, events, concerts, performances, music festivals, live music, tour dates"
        />
      </Head>

      <Layout>
        <div className="slides" ref={slidesRef}>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/2.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/3.jpg)" }}
            ></div>
          </div>
          <div className="slide slide--current">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/1.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/4.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/5.jpg)" }}
            ></div>
          </div>
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ backgroundImage: "url(/img/demo3/1.jpg)" }}
          ></div>
        </div>

        <div className="cover">
          <h2 className="cover__title" ref={titleRef} data-splitting>
            Events
          </h2>
          <p className="cover__description">
            Upcoming performances: 21-23 May AMRC (Africa Rising Music Festival)
            Johannesburg, SA | 24-25 May Bassline Festival, Johannesburg SA
          </p>
          <button className="cover__button unbutton" onClick={toggleEffect}>
            View Schedule
          </button>
        </div>
      </Layout>
    </>
  );
}

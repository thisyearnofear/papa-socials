import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation } from "../../hooks/useClipAnimation";
import { useEffect } from "react";
import React from "react";

export default function MusicPage() {
  const { clipRef, clipImageRef, slidesRef, titleRef, toggleEffect } = useClipAnimation();
  
  return (
    <>
      <Head>
        <title>PAPA | Music & Lyrics</title>
        <meta name="description" content="British-Kenyan singer-songwriter PAPA's music beams with afro inspired gospel, latino rhythms alongside that europa spiritus animus." />
        <meta name="keywords" content="PAPA, music, lyrics, afro, gospel, latino, british-kenyan, singer-songwriter" />
      </Head>
      
      <Layout>
        <div className="slides" ref={slidesRef}>
          <div className="slide"><div className="slide__img" style={{backgroundImage: 'url(/img/demo1/2.jpg)'}}></div></div>
          <div className="slide"><div className="slide__img" style={{backgroundImage: 'url(/img/demo1/3.jpg)'}}></div></div>
          <div className="slide slide--current"><div className="slide__img" style={{backgroundImage: 'url(/img/demo1/1.jpg)'}}></div></div>
          <div className="slide"><div className="slide__img" style={{backgroundImage: 'url(/img/demo1/4.jpg)'}}></div></div>
          <div className="slide"><div className="slide__img" style={{backgroundImage: 'url(/img/demo1/5.jpg)'}}></div></div>
        </div>
        
        <div className="clip" ref={clipRef}>
          <div className="clip__img" ref={clipImageRef} style={{backgroundImage: 'url(/img/demo1/1.jpg)'}}></div>
        </div>
        
        <div className="cover">
          <h2 className="cover__title" ref={titleRef} data-splitting>PAPA</h2>
          <p className="cover__description">
            British-Kenyan singer-songwriter whose music beams with afro inspired gospel, 
            latino rhythms alongside that europa spiritus animus.
          </p>
          <button className="cover__button unbutton" onClick={toggleEffect}>
            Explore Music
          </button>
        </div>
      </Layout>
    </>
  );
}

import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation } from "../../hooks/useClipAnimation";
import React from "react";

export default function SocialPage() {
  const { clipRef, clipImageRef, slidesRef, titleRef, toggleEffect } = useClipAnimation();
  
  return (
    <>
      <Head>
        <title>PAPA | Social Media</title>
        <meta name="description" content="Connect with PAPA across various social media platforms and stay updated with the latest music and performances." />
        <meta name="keywords" content="PAPA, social media, twitter, instagram, facebook, spotify, soundcloud, music artist" />
      </Head>
      
      <Layout>
        <div className="slides" ref={slidesRef}>
          <div className="slide"><div className="slide__img" style={{backgroundImage: 'url(/img/demo2/2.jpg)'}}></div></div>
          <div className="slide"><div className="slide__img" style={{backgroundImage: 'url(/img/demo2/3.jpg)'}}></div></div>
          <div className="slide slide--current"><div className="slide__img" style={{backgroundImage: 'url(/img/demo2/1.jpg)'}}></div></div>
          <div className="slide"><div className="slide__img" style={{backgroundImage: 'url(/img/demo2/4.jpg)'}}></div></div>
          <div className="slide"><div className="slide__img" style={{backgroundImage: 'url(/img/demo2/5.jpg)'}}></div></div>
        </div>
        
        <div className="clip" ref={clipRef}>
          <div className="clip__img" ref={clipImageRef} style={{backgroundImage: 'url(/img/demo2/1.jpg)'}}></div>
        </div>
        
        <div className="cover">
          <h2 className="cover__title" ref={titleRef} data-splitting>Connect</h2>
          <p className="cover__description">
            Follow PAPA across social platforms: Farcaster: @papa - Lens: @papajams - 
            Twitter: @papajimjams - Insta: @papajams - Medium: @papajams
          </p>
          <button className="cover__button unbutton" onClick={toggleEffect}>
            View Socials
          </button>
        </div>
      </Layout>
    </>
  );
}

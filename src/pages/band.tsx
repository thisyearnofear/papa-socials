import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation, ClipAnimationReturn } from "../../hooks/useClipAnimation";
import React from "react";

export default function BandPage() {
  // Use the refactored hook with custom options for band/discography page
  const { 
    clipRef, 
    clipImageRef, 
    slidesRef, 
    titleRef, 
    toggleEffect,
    stage,
    handleSlideClick
  }: ClipAnimationReturn = useClipAnimation({
    initialStage: 'initial',
    stages: ['initial', 'grid', 'discography'],
    callbacks: {
      // Custom callback when stage changes
      onStageChange: (newStage: string, index?: number) => {
        console.log(`Band page transitioned to ${newStage} stage`, index ? `with slide ${index}` : '');
      }
    },
    // Custom animation options specific to band/discography page
    defaultAnimationOptions: {
      gridToContent: {
        // Customize the grid to content transition for discography
        slideOpacity: 0.2,
        slideScale: 0.85,
        selectedOpacity: 0.9,
        selectedScale: 1.1,
        selectedY: -30,
        contentSelector: '.discography-container'
      },
      contentToGrid: {
        contentSelector: '.discography-container'
      }
    }
  });

  return (
    <>
      <Head>
        <title>PAPA | The Band</title>
        <meta
          name="description"
          content="Meet the talented musicians who collaborate with PAPA to create the unique sound that blends afro inspired gospel, latino rhythms, and European influences. Explore PAPA's discography including albums Distance, Legacy, Rafiki, Down In The Dirt and EPs Zeno and Paradox."
        />
        <meta
          name="keywords"
          content="PAPA, band members, musicians, collaborators, afro gospel, latino rhythms, music artists, Distance, Legacy, Rafiki, Down In The Dirt, Zeno, Paradox, lyrics"
        />
      </Head>

      <Layout>
        {/* Original Band Content */}
        <div className="slides" ref={slidesRef}>
          {[2, 3, 1, 4, 5].map((num, index) => (
            <div 
              key={num}
              className={`slide ${num === 1 ? 'slide--current' : ''}`}
              onClick={() => {
                if (stage === 'grid') {
                  handleSlideClick(index, {
                    // Custom options for the slide click animation
                    onCompleteCallback: () => {
                      console.log(`Selected album ${index}`);
                    }
                  });
                }
              }}
              style={{
                cursor: stage === 'grid' ? 'pointer' : 'default',
              }}
            >
              <div
                className="slide__img"
                style={{ backgroundImage: `url(/img/demo4/${num}.jpg)` }}
              ></div>
            </div>
          ))}
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
          <button className="cover__button unbutton" onClick={(e) => { e.preventDefault(); toggleEffect(); }}>
            Meet The Band
          </button>
        </div>

        {/* Discography Container - appears after slide selection */}
        <div className="discography-container" style={{ display: stage === 'discography' ? 'block' : 'none' }}>
          <div className="discography-header">
            <h2>DISCOGRAPHY</h2>
            <button className="discography-back" onClick={(e) => { e.preventDefault(); toggleEffect(); }}>
              ← Back to band
            </button>
          </div>
          
          <div className="discography-content">
            <div className="album-section">
              <h3>ALBUMS</h3>
              <div className="album-grid">
                {/* Down In The Dirt (2024) */}
                <div className="album-item" onClick={(e) => { e.preventDefault(); console.log('Down In The Dirt clicked'); }}>
                  <div className="album-cover" style={{ backgroundImage: "url(/img/albums/down-in-the-dirt.jpg)" }}></div>
                  <div className="album-info">
                    <h4>Down In The Dirt</h4>
                    <p>2024</p>
                  </div>
                </div>
                
                {/* Rafiki (2024) */}
                <div className="album-item" onClick={(e) => { e.preventDefault(); console.log('Rafiki clicked'); }}>
                  <div className="album-cover" style={{ backgroundImage: "url(/img/albums/rafiki.jpg)" }}></div>
                  <div className="album-info">
                    <h4>Rafiki</h4>
                    <p>2024</p>
                  </div>
                </div>
                
                {/* Legacy (2022) */}
                <div className="album-item" onClick={(e) => { e.preventDefault(); console.log('Legacy clicked'); }}>
                  <div className="album-cover" style={{ backgroundImage: "url(/img/albums/legacy.jpg)" }}></div>
                  <div className="album-info">
                    <h4>Legacy</h4>
                    <p>2022</p>
                  </div>
                </div>
                
                {/* Distance (2019) */}
                <div className="album-item" onClick={(e) => { e.preventDefault(); console.log('Distance clicked'); }}>
                  <div className="album-cover" style={{ backgroundImage: "url(/img/albums/distance.jpg)" }}></div>
                  <div className="album-info">
                    <h4>Distance</h4>
                    <p>2019</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="album-section">
              <h3>EPs</h3>
              <div className="album-grid">
                {/* Zeno (2021) */}
                <div className="album-item" onClick={(e) => { e.preventDefault(); console.log('Zeno clicked'); }}>
                  <div className="album-cover" style={{ backgroundImage: "url(/img/albums/zeno.jpg)" }}></div>
                  <div className="album-info">
                    <h4>Zeno</h4>
                    <p>2021</p>
                  </div>
                </div>
                
                {/* Paradox (TBD) */}
                <div className="album-item" onClick={(e) => { e.preventDefault(); console.log('Paradox clicked'); }}>
                  <div className="album-cover" style={{ backgroundImage: "url(/img/albums/paradox.jpg)" }}></div>
                  <div className="album-info">
                    <h4>Paradox</h4>
                    <p>Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

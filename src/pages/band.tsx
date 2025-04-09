import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation, ClipAnimationReturn } from "../../hooks/useClipAnimation";
import React from "react";
import { bandMembers } from "../../data/band-members";
import { motion, AnimatePresence } from "framer-motion";

export default function BandPage() {
  const [selectedMember, setSelectedMember] = React.useState<number | null>(null);

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
        {/* Band Members Grid */}
        <div className="slides" ref={slidesRef}>
          {bandMembers.map((member, index) => (
            <div 
              key={member.id}
              className={`slide ${index === 0 ? 'slide--current' : ''}`}
              onClick={() => {
                if (stage === 'grid') {
                  handleSlideClick(index, {
                    onCompleteCallback: () => {
                      setSelectedMember(member.id);
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
                style={{ backgroundImage: `url(${member.image})` }}
              >
                {stage === 'grid' && (
                  <div className="slide__info">
                    <h3>{member.name}</h3>
                    <p>{member.instrument}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ backgroundImage: `url(${bandMembers[0].image})` }}
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

        {/* Band Member Details - appears after slide selection */}
        <AnimatePresence>
          {stage === 'discography' && selectedMember && (
            <motion.div 
              className="band-member-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="band-member-header">
                <h2>BAND MEMBER</h2>
                <button className="band-member-back" onClick={(e) => { e.preventDefault(); toggleEffect(); }}>
                  ← Back to band
                </button>
              </div>
              
              <div className="band-member-content">
                {bandMembers.find(member => member.id === selectedMember) && (
                  <div className="band-member-details">
                    <div 
                      className="band-member-image"
                      style={{
                        backgroundImage: `url(${bandMembers.find(member => member.id === selectedMember)?.image})`
                      }}
                    />
                    <div className="band-member-info">
                      <h3>{bandMembers.find(member => member.id === selectedMember)?.name}</h3>
                      <p>{bandMembers.find(member => member.id === selectedMember)?.instrument}</p>
                      {bandMembers.find(member => member.id === selectedMember)?.isGroupPhoto && (
                        <p className="group-photo-label">Group Photo</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
    </>
  );
}

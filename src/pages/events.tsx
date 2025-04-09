import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation, ClipAnimationReturn } from "../../hooks/useClipAnimation";
import React from "react";
import "../../styles/events.css";

export default function EventsPage() {
  const { clipRef, clipImageRef, slidesRef, titleRef, toggleEffect, stage }: ClipAnimationReturn = 
    useClipAnimation({
      initialStage: 'initial',
      stages: ['initial', 'grid', 'events'],
      callbacks: {
        onStageChange: (newStage: string, index?: number) => {
          console.log(`Events page transitioned to ${newStage} stage`);
        }
      },
      defaultAnimationOptions: {
        gridToContent: {
          contentSelector: '.events-container'
        },
        contentToGrid: {
          contentSelector: '.events-container'
        }
      }
    });

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
          <button className="cover__button unbutton" onClick={(e) => { e.preventDefault(); toggleEffect(); }}>
            View Schedule
          </button>
        </div>
        
        {/* Events Container - appears after transition */}
        <div className="events-container" style={{ display: stage === 'events' ? 'block' : 'none' }}>
          <div className="events-header">
            <h2>UPCOMING EVENTS</h2>
            <button className="events-back" onClick={(e) => { e.preventDefault(); toggleEffect(); }}>
              ← Back to events
            </button>
          </div>
          
          <div className="events-content">
            <div className="event-list">
              {/* Event 1 */}
              <div className="event-item">
                <div className="event-date">
                  <span className="event-month">MAY</span>
                  <span className="event-day">21-23</span>
                  <span className="event-year">2024</span>
                </div>
                <div className="event-details">
                  <h3>Africa Rising Music Festival</h3>
                  <p className="event-location">Johannesburg, South Africa</p>
                  <p className="event-description">PAPA will be headlining the main stage on May 22nd.</p>
                  <a href="#" className="event-tickets" onClick={(e) => { e.preventDefault(); console.log('Tickets clicked'); }}>Get Tickets</a>
                </div>
              </div>
              
              {/* Event 2 */}
              <div className="event-item">
                <div className="event-date">
                  <span className="event-month">MAY</span>
                  <span className="event-day">24-25</span>
                  <span className="event-year">2024</span>
                </div>
                <div className="event-details">
                  <h3>Bassline Festival</h3>
                  <p className="event-location">Johannesburg, South Africa</p>
                  <p className="event-description">PAPA will perform on May 25th with special guests.</p>
                  <a href="#" className="event-tickets" onClick={(e) => { e.preventDefault(); console.log('Tickets clicked'); }}>Get Tickets</a>
                </div>
              </div>
              
              {/* Event 3 */}
              <div className="event-item">
                <div className="event-date">
                  <span className="event-month">JUN</span>
                  <span className="event-day">15</span>
                  <span className="event-year">2024</span>
                </div>
                <div className="event-details">
                  <h3>Summer Music Festival</h3>
                  <p className="event-location">London, UK</p>
                  <p className="event-description">PAPA's European tour kicks off with this special performance.</p>
                  <a href="#" className="event-tickets" onClick={(e) => { e.preventDefault(); console.log('Tickets clicked'); }}>Get Tickets</a>
                </div>
              </div>
              
              {/* Event 4 */}
              <div className="event-item">
                <div className="event-date">
                  <span className="event-month">JUL</span>
                  <span className="event-day">10</span>
                  <span className="event-year">2024</span>
                </div>
                <div className="event-details">
                  <h3>Down In The Dirt Album Release Party</h3>
                  <p className="event-location">Berlin, Germany</p>
                  <p className="event-description">Celebrating the release of PAPA's newest album with a special intimate show.</p>
                  <a href="#" className="event-tickets" onClick={(e) => { e.preventDefault(); console.log('Tickets clicked'); }}>Get Tickets</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

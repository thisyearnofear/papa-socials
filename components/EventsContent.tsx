import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OptimizedImage } from "./OptimizedImage";

interface EventsContentProps {
  onBackClick: () => void;
}

const EventsContent: React.FC<EventsContentProps> = ({ onBackClick }) => {
  return (
    <AnimatePresence>
      <motion.div
        className="papa-events-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="papa-events-header">
          <button className="papa-events-back" onClick={onBackClick}>
            ← Back to Events
          </button>
        </div>

        <div className="papa-events-content">
          <div className="papa-events-list">
            {/* Event 1 - Africa Rising Music Conference */}
            <div className="papa-event-item">
              <div className="papa-event-image-wrapper">
                <OptimizedImage
                  src="/img/demo3/2.jpg"
                  alt="Africa Rising Music Conference"
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                  quality={85}
                />
              </div>
              <div className="papa-event-info">
                <div className="papa-event-date">
                  <span className="papa-event-month">MAY</span>
                  <span className="papa-event-day">22</span>
                  <span className="papa-event-year">2025</span>
                </div>
                <div className="papa-event-details">
                  <h3>ARMC 2025</h3>
                  <p className="papa-event-location">
                    11 Kotze street, Braamfontein Joburg, SA
                  </p>
                  <p className="papa-event-time">Thu 09:30 - Fri 23:59</p>
                  <p className="papa-event-description">
                    Presented by Africa Rising Music Conference 2025
                  </p>
                  <a
                    href="https://ra.co/events/2110727"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="papa-event-tickets"
                  >
                    Get Tickets
                  </a>
                </div>
              </div>
            </div>

            {/* Event 2 - Bassline Fest */}
            <div className="papa-event-item">
              <div className="papa-event-image-wrapper">
                <OptimizedImage
                  src="/img/demo3/3.jpg"
                  alt="Bassline Fest"
                  fill
                  style={{ objectFit: "cover" }}
                  quality={85}
                />
              </div>
              <div className="papa-event-info">
                <div className="papa-event-date">
                  <span className="papa-event-month">MAY</span>
                  <span className="papa-event-day">24-25</span>
                  <span className="papa-event-year">2025</span>
                </div>
                <div className="papa-event-details">
                  <h3>Bassline Fest 2025</h3>
                  <p className="papa-event-location">
                    Constitutional Hill, Johannesburg, South Africa
                  </p>
                  <p className="papa-event-time">Sat & Sun - All Day</p>
                  <p className="papa-event-description">
                    Presented by Bassline Fest 2025
                  </p>
                  <a
                    href="https://bassline.co.za/bassline-fest/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="papa-event-tickets"
                  >
                    Get Tickets
                  </a>
                </div>
              </div>
            </div>

            {/* Support Information */}
            <div className="papa-support-info">
              <p className="papa-support-text">
                Papa is supported by PRS Foundation&apos;s International
                Showcase Fund, which is run by PRS Foundation in partnership
                with Department of Business and Trade (DBT), British
                Underground, Arts Council England, British Council, The
                Musicians&apos; Union (MU), PPL, Creative Scotland, Wales Arts
                International and Arts Council of Northern Ireland
              </p>
              <div className="papa-support-logo">
                <OptimizedImage
                  src="/ISF.png"
                  alt="International Showcase Fund Logo"
                  width={200}
                  height={100}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventsContent;

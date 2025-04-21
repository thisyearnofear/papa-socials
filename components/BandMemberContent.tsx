import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BandMember {
  id: number;
  name: string;
  instrument: string;
  image: string;
  isGroupPhoto?: boolean;
}

interface BandMemberContentProps {
  selectedMember: number | null;
  bandMembers: BandMember[];
  handleBackClick: (e: React.MouseEvent) => void;
  setSelectedMember: (id: number) => void;
}

export const BandMemberContent: React.FC<BandMemberContentProps> = ({
  selectedMember,
  bandMembers,
  handleBackClick,
  setSelectedMember,
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="band-member-container visible-container"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "auto",
          opacity: 1,
          marginLeft: "clamp(0px, 3vw, 20px)",
          marginRight: "clamp(0px, 3vw, 20px)",
          paddingBottom: "clamp(20px, 8vh, 40px)",
          height: "100vh",
          overflowY: "auto",
          background: "rgba(0, 0, 0, 0.85)",
          zIndex: 1000,
          willChange: "transform, opacity",
          display: "block",
          overflowX: "hidden",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="band-member-header"
          style={{
            padding: "clamp(10px, 4vw, 20px)",
            position: "sticky",
            top: 0,
            zIndex: 1001,
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <h2>THE BAND</h2>
          <button
            className="back-button"
            onClick={handleBackClick}
            style={{
              padding: "clamp(8px, 2vw, 12px) clamp(12px, 4vw, 20px)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid white",
              color: "white",
              cursor: "pointer",
              borderRadius: "4px",
              zIndex: 1002,
              position: "relative",
              fontSize: "clamp(14px, 3.5vw, 16px)",
              fontWeight: "bold",
              transition: "all 0.2s ease",
            }}
          >
            Back
          </button>
        </div>

        <motion.div
          className="band-member-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.4,
              delay: 0.1,
              ease: "easeOut",
            },
          }}
          style={{
            padding: "clamp(10px, 4vw, 20px)",
            position: "relative",
            zIndex: 1001,
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {/* Selected Member */}
          {bandMembers.find((member) => member.id === selectedMember) && (
            <div
              className="selected-member"
              style={{
                marginBottom: "clamp(20px, 5vh, 40px)",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "clamp(10px, 3vh, 20px)",
                  textAlign: "center",
                  padding: "clamp(10px, 3vw, 20px)",
                  maxWidth: "min(800px, 100%)",
                  margin: "0 auto",
                  width: "100%",
                }}
              >
                <div
                  className="band-member-image"
                  style={{
                    backgroundImage: `url(${
                      bandMembers.find((member) => member.id === selectedMember)
                        ?.image
                    })`,
                    width: "100%",
                    height: "clamp(250px, 50vw, 400px)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    marginBottom: "clamp(10px, 3vh, 20px)",
                    borderRadius: "8px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                  }}
                />
                <div className="band-member-info">
                  <h3
                    style={{
                      fontSize: "clamp(1.5rem, 6vw, 2rem)",
                      marginBottom: "clamp(5px, 2vh, 10px)",
                    }}
                  >
                    {
                      bandMembers.find((member) => member.id === selectedMember)
                        ?.name
                    }
                  </h3>
                  <p
                    style={{
                      fontSize: "clamp(1rem, 4vw, 1.2rem)",
                      color: "rgba(255, 255, 255, 0.8)",
                      marginBottom: "clamp(10px, 3vh, 20px)",
                    }}
                  >
                    {
                      bandMembers.find((member) => member.id === selectedMember)
                        ?.instrument
                    }
                  </p>
                  {bandMembers.find((member) => member.id === selectedMember)
                    ?.isGroupPhoto && (
                    <p
                      className="group-photo-label"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        display: "inline-block",
                      }}
                    >
                      Group Photo
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* All Band Members List */}
          <div className="all-members">
            <h3
              style={{
                marginBottom: "clamp(10px, 3vh, 20px)",
                textAlign: "center",
                fontSize: "clamp(1.2rem, 5vw, 1.5rem)",
              }}
            >
              ALL BAND MEMBERS
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(clamp(150px, 40vw, 250px), 1fr))",
                gap: "clamp(10px, 3vw, 20px)",
                maxWidth: "min(1200px, 100%)",
                margin: "0 auto",
                width: "100%",
              }}
            >
              {bandMembers.map((member) => (
                <motion.div
                  key={member.id}
                  className={`member-card ${
                    selectedMember === member.id ? "selected" : ""
                  }`}
                  whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.2 },
                  }}
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedMember === member.id
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    border:
                      selectedMember === member.id
                        ? "1px solid rgba(255, 255, 255, 0.5)"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  onClick={() => setSelectedMember(member.id)}
                >
                  <div
                    style={{
                      height: "clamp(120px, 30vw, 200px)",
                      backgroundImage: `url(${member.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  />
                  <div style={{ padding: "clamp(8px, 3vw, 15px)" }}>
                    <h4
                      style={{
                        marginBottom: "clamp(3px, 1vh, 5px)",
                        fontSize: "clamp(0.9rem, 3.5vw, 1.1rem)",
                      }}
                    >
                      {member.name}
                    </h4>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "clamp(0.8rem, 3vw, 0.9rem)",
                      }}
                    >
                      {member.instrument}
                    </p>
                    {member.isGroupPhoto && (
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "0.7rem",
                          padding: "2px 5px",
                          background: "rgba(255, 255, 255, 0.2)",
                          borderRadius: "3px",
                          marginTop: "5px",
                        }}
                      >
                        Group
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

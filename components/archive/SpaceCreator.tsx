import React from "react";

interface SpaceCreatorProps {
  spaceName: string;
  onSpaceNameChange: (name: string) => void;
  onCreateSpace: (e: React.FormEvent) => Promise<void>;
  isCreatingSpace: boolean;
  availableSpaces: Array<{ did: string; name: string }>;
  onSpaceSelection: (spaceDid: string) => void;
  isLoadingSpaces: boolean;
  hasMoreSpaces: boolean;
  onLoadMoreSpaces: () => Promise<void>;
}

export const SpaceCreator: React.FC<SpaceCreatorProps> = ({
  spaceName,
  onSpaceNameChange,
  onCreateSpace,
  isCreatingSpace,
  availableSpaces,
  onSpaceSelection,
  isLoadingSpaces,
  hasMoreSpaces,
  onLoadMoreSpaces,
}) => {
  return (
    <div
      style={{
        background: "rgba(30, 30, 30, 0.9)",
        padding: "25px",
        borderRadius: "10px",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
        marginTop: "20px",
      }}
    >
      <h3 style={{ color: "#4fd1c5", marginBottom: "15px" }}>
        Login Successful!
      </h3>
      <p>Would you like to create a new storage space for your content?</p>

      {/* Available Spaces List */}
      {availableSpaces.length > 0 && (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <h4 style={{ color: "#fff", marginBottom: "10px" }}>
            Your Available Spaces:
          </h4>
          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              background: "rgba(40, 40, 40, 0.6)",
              padding: "8px",
              borderRadius: "5px",
            }}
          >
            {availableSpaces.map((space) => (
              <div
                key={space.did}
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold" }}>{space.name}</div>
                  <div style={{ fontSize: "11px", opacity: 0.7 }}>
                    {space.did.substring(0, 15)}...
                  </div>
                </div>
                <button
                  onClick={() => onSpaceSelection(space.did)}
                  style={{
                    background: "rgba(79, 209, 197, 0.2)",
                    color: "#fff",
                    border: "1px solid rgba(79, 209, 197, 0.5)",
                    borderRadius: "4px",
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Select
                </button>
              </div>
            ))}
          </div>

          {/* Load More Spaces Button */}
          {hasMoreSpaces && (
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <button
                onClick={onLoadMoreSpaces}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                }}
                disabled={isLoadingSpaces}
              >
                {isLoadingSpaces ? (
                  <>
                    <span className="button-spinner"></span>
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Spaces
                    <span style={{ fontSize: "14px" }}>↓</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create New Space Form */}
      <div style={{ marginTop: "20px" }}>
        <div className="archive-form-group">
          <label
            className="archive-form-label"
            style={{ color: "#fff", fontWeight: "bold" }}
          >
            Space Name
          </label>
          <input
            type="text"
            value={spaceName}
            onChange={(e) => onSpaceNameChange(e.target.value)}
            className="archive-form-input"
            placeholder="my-awesome-space"
            style={{
              background: "rgba(50, 50, 50, 0.7)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
            required
          />
        </div>

        <button
          onClick={onCreateSpace}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
            background: "#4fd1c5",
            border: "none",
            borderRadius: "5px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px",
          }}
          disabled={isCreatingSpace || !spaceName}
        >
          {isCreatingSpace ? (
            <>
              <span className="button-spinner"></span>
              Creating...
            </>
          ) : (
            "Create New Space"
          )}
        </button>
      </div>
    </div>
  );
};

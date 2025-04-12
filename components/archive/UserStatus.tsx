import React from "react";
import { UserSpace } from "../../contexts/filecoin-context";

interface UserStatusProps {
  userSpace: UserSpace | null;
  availableSpaces: Array<{ did: string; name: string }>;
  onSpaceSelection: (spaceDid: string) => void;
  onLogout: () => void;
}

export const UserStatus: React.FC<UserStatusProps> = ({
  userSpace,
  availableSpaces,
  onSpaceSelection,
  onLogout,
}) => {
  if (!userSpace) {
    return (
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <p
          className="login-prompt"
          style={{
            fontStyle: "italic",
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: "10px",
          }}
        >
          Please login to manage your catalogue space
        </p>
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("setActiveTab", { detail: "login" })
            )
          }
          style={{
            padding: "8px 16px",
            background: "rgba(79, 209, 197, 0.2)",
            border: "1px solid rgba(79, 209, 197, 0.5)",
            borderRadius: "5px",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Login Now
        </button>
      </div>
    );
  }

  return (
    <div
      className="user-space-info"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div>
        <h3 style={{ margin: "0 0 5px 0", color: "#fff" }}>
          Connected Space:{" "}
          <span style={{ color: "#4fd1c5" }}>{userSpace.spaceName}</span>
        </h3>
        <p
          style={{
            margin: "0",
            fontSize: "14px",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Account: {userSpace.email}
        </p>
        <p
          style={{
            margin: "5px 0 0 0",
            fontSize: "12px",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Space ID: {userSpace.spaceDid.substring(0, 20)}...
        </p>

        {availableSpaces.length > 1 && (
          <div style={{ marginTop: "10px" }}>
            <select
              value={userSpace.spaceDid}
              onChange={(e) => onSpaceSelection(e.target.value)}
              style={{
                background: "rgba(50, 50, 50, 0.8)",
                color: "white",
                border: "1px solid rgba(79, 209, 197, 0.5)",
                borderRadius: "4px",
                padding: "5px 10px",
                fontSize: "14px",
                width: "100%",
                maxWidth: "250px",
              }}
            >
              {availableSpaces.map((space) => (
                <option key={space.did} value={space.did}>
                  {space.name}{" "}
                  {space.did === userSpace.spaceDid ? "(current)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <button
        className="logout-button"
        onClick={onLogout}
        style={{
          padding: "8px 15px",
          background: "rgba(255, 100, 100, 0.2)",
          border: "1px solid rgba(255, 100, 100, 0.5)",
          borderRadius: "5px",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Logout
      </button>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UploadStatus } from "./types";
import { UserSpace } from "../../contexts/filecoin-context";

// Add DID validation helper
const isValidDID = (did: string): boolean => {
  // Basic DID format validation: did:method:specific-id
  const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9.%-]+$/;
  return didRegex.test(did);
};

// Add expiration helper
const calculateTimeRemaining = (expirationTimestamp: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expirationTimestamp - now;

  if (remaining <= 0) return "Expired";

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} days remaining`;
  }
  return `${hours}h ${minutes}m remaining`;
};

interface DelegationInfo {
  id: string;
  audienceDid: string;
  abilities: string[];
  expirationTimestamp: number;
  proof: string; // Base64 encoded delegation proof
}

interface DelegationManagerProps {
  userSpace: UserSpace | null;
  uploadStatus: UploadStatus | null;
  setUploadStatus: (status: UploadStatus | null) => void;
  onDelegationComplete: () => void;
  onError: (error: string) => void;
}

export const DelegationManager: React.FC<DelegationManagerProps> = ({
  userSpace,
  setUploadStatus,
  onDelegationComplete,
  onError,
}) => {
  const [audienceDid, setAudienceDid] = useState<string>("");
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([
    "space/blob/add",
    "upload/add",
  ]);
  const [expirationHours, setExpirationHours] = useState<number>(24);
  const [isCreatingDelegation, setIsCreatingDelegation] =
    useState<boolean>(false);
  const [delegationResult, setDelegationResult] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [receivedDelegation, setReceivedDelegation] = useState<string>("");
  const [isImportingDelegation, setIsImportingDelegation] =
    useState<boolean>(false);
  const [activeDelegations, setActiveDelegations] = useState<DelegationInfo[]>(
    []
  );

  // Get the current agent DID (client-side only)
  useEffect(() => {
    const fetchAgentDid = async () => {
      if (typeof window !== "undefined") {
        try {
          const response = await fetch("/api/storage/delegation/get-agent-did");
          const data = await response.json();
          if (data.success && data.agentDid) {
            setActiveAgent(data.agentDid);
          }
        } catch (error) {
          console.error("Error fetching agent DID:", error);
        }
      }
    };

    fetchAgentDid();
  }, []);

  // Add validation before creating delegation
  const validateDelegation = (): boolean => {
    if (!userSpace) {
      setUploadStatus({
        message: "No active space selected",
        status: "error",
      });
      return false;
    }

    if (!isValidDID(audienceDid)) {
      setUploadStatus({
        message:
          "Invalid DID format. Must start with 'did:' followed by method and identifier",
        status: "error",
      });
      return false;
    }

    if (selectedAbilities.length === 0) {
      setUploadStatus({
        message: "Please select at least one permission",
        status: "error",
      });
      return false;
    }

    if (expirationHours < 1 || expirationHours > 8760) {
      setUploadStatus({
        message: "Expiration time must be between 1 hour and 1 year",
        status: "error",
      });
      return false;
    }

    return true;
  };

  // Modify handleCreateDelegation to use validation
  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDelegation()) return;

    setIsCreatingDelegation(true);
    setUploadStatus({
      status: "loading",
      message: "Creating delegation...",
    });

    try {
      const response = await fetch("/api/storage/delegation/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spaceDid: userSpace!.spaceDid,
          email: userSpace!.email,
          audienceDid,
          abilities: selectedAbilities,
          expirationHours,
        }),
      });

      const data = await response.json();

      if (data.success && data.delegation) {
        const delegationBase64 = Buffer.from(data.delegation).toString(
          "base64"
        );
        setDelegationResult(delegationBase64);

        // Add to active delegations
        setActiveDelegations((prev) => [
          ...prev,
          {
            id: data.delegationId,
            audienceDid,
            abilities: selectedAbilities,
            expirationTimestamp:
              Math.floor(Date.now() / 1000) + expirationHours * 3600,
            proof: delegationBase64,
          },
        ]);

        setUploadStatus({
          message: "Delegation created successfully!",
          status: "success",
        });

        if (onDelegationComplete) {
          onDelegationComplete();
        }
      } else {
        throw new Error(data.message || "Failed to create delegation");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setUploadStatus({
        message: `Error creating delegation: ${errorMessage}`,
        status: "error",
      });
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsCreatingDelegation(false);
    }
  };

  // Function to copy delegation to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setUploadStatus({
          message: "Delegation copied to clipboard!",
          status: "success",
        });
        setTimeout(() => setUploadStatus(null), 3000);
      })
      .catch((err) => {
        console.error("Failed to copy delegation:", err);
        setUploadStatus({
          message: "Failed to copy delegation",
          status: "error",
        });
      });
  };

  // Function to apply a received delegation
  const handleApplyDelegation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receivedDelegation) {
      setUploadStatus({
        message: "Please paste the delegation string",
        status: "error",
      });
      return;
    }

    setIsImportingDelegation(true);
    setUploadStatus({
      status: "loading",
      message: "Using delegation...",
    });

    try {
      const response = await fetch("/api/storage/delegation/use", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delegation: receivedDelegation,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatus({
          message: `Successfully connected to shared space: ${
            data.spaceName || data.spaceDid
          }`,
          status: "success",
        });

        // Clear the form
        setReceivedDelegation("");

        // Refresh the page to load the new space
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setUploadStatus({
          message: `Failed to apply delegation: ${data.message}`,
          status: "error",
        });
      }
    } catch (error) {
      console.error("Error applying delegation:", error);
      setUploadStatus({
        message: `Error applying delegation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        status: "error",
      });
    } finally {
      setIsImportingDelegation(false);
    }
  };

  // Add automatic refresh of delegations
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setActiveDelegations((prev) =>
        prev.filter((d) => {
          const now = Math.floor(Date.now() / 1000);
          return d.expirationTimestamp > now;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, []);

  // Update the revocation handler
  const handleRevokeDelegation = async (delegationId: string) => {
    try {
      const delegation = activeDelegations.find((d) => d.id === delegationId);
      if (!delegation) {
        throw new Error("Delegation not found");
      }

      setUploadStatus({
        status: "loading",
        message: "Revoking delegation...",
      });

      const response = await fetch("/api/storage/delegation/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delegationId,
          spaceDid: userSpace?.spaceDid,
          proof: delegation.proof,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setActiveDelegations((prev) =>
          prev.filter((d) => d.id !== delegationId)
        );
        setUploadStatus({
          message: "Delegation revoked successfully",
          status: "success",
        });
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        throw new Error(data.message || "Failed to revoke delegation");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setUploadStatus({
        message: `Error revoking delegation: ${errorMessage}`,
        status: "error",
      });
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return (
    <motion.div
      className="archive-share"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="section-title">Share Access to Your Space</h2>

      <div className="share-intro">
        <p>
          Create delegations to allow other users or applications to access your
          space. Delegations are based on the UCAN protocol, which provides
          fine-grained permission control.
        </p>
      </div>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div style={{ flex: "1" }}>
          <div
            className="current-agent-section"
            style={{
              padding: "15px",
              background: "rgba(30, 30, 30, 0.8)",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>Your Agent DID</h3>
            <p
              style={{
                fontSize: "14px",
                opacity: "0.8",
                margin: "0 0 10px 0",
              }}
            >
              This is your current identity on this device.
            </p>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                padding: "10px",
                borderRadius: "4px",
                wordBreak: "break-all",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
            >
              {activeAgent || "Loading agent DID..."}
            </div>
          </div>

          <form
            onSubmit={handleCreateDelegation}
            style={{
              background: "rgba(30, 30, 30, 0.8)",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0" }}>Create Delegation</h3>

            <div className="archive-form-group">
              <label className="archive-form-label">Recipient Agent DID</label>
              <input
                type="text"
                value={audienceDid}
                onChange={(e) => setAudienceDid(e.target.value)}
                className="archive-form-input"
                placeholder="did:key:..."
                style={{
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
                required
              />
              <small
                style={{
                  display: "block",
                  opacity: "0.7",
                  marginTop: "5px",
                }}
              >
                The recipient must provide you with their agent DID.
              </small>
            </div>

            <div className="archive-form-group">
              <label className="archive-form-label">Permissions</label>
              <div style={{ marginTop: "8px" }}>
                {[
                  { id: "space/blob/add", label: "Add Content" },
                  { id: "upload/add", label: "Create Uploads" },
                  { id: "upload/list", label: "List Uploads" },
                  { id: "space/info", label: "View Space Info" },
                  { id: "filecoin/offer", label: "Make Filecoin Deals" },
                ].map((ability) => (
                  <div key={ability.id} style={{ marginBottom: "8px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAbilities.includes(ability.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAbilities((prev) => [
                              ...prev,
                              ability.id,
                            ]);
                          } else {
                            setSelectedAbilities((prev) =>
                              prev.filter((a) => a !== ability.id)
                            );
                          }
                        }}
                        style={{ marginRight: "8px" }}
                      />
                      {ability.label}{" "}
                      <code
                        style={{
                          marginLeft: "5px",
                          opacity: "0.7",
                          fontSize: "12px",
                        }}
                      >
                        ({ability.id})
                      </code>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="archive-form-group">
              <label className="archive-form-label">Expiration (hours)</label>
              <input
                type="number"
                value={expirationHours}
                onChange={(e) => setExpirationHours(parseInt(e.target.value))}
                min="1"
                max="8760" // 1 year
                className="archive-form-input"
                style={{
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
              />
              <small
                style={{
                  display: "block",
                  opacity: "0.7",
                  marginTop: "5px",
                }}
              >
                Delegation will expire after this many hours.
              </small>
            </div>

            <button
              type="submit"
              disabled={isCreatingDelegation}
              style={{
                width: "100%",
                padding: "12px",
                background: "#4fd1c5",
                border: "none",
                borderRadius: "5px",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "16px",
                marginTop: "15px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isCreatingDelegation ? (
                <>
                  <span className="button-spinner"></span>
                  Creating...
                </>
              ) : (
                "Create Delegation"
              )}
            </button>
          </form>
        </div>

        <div style={{ flex: "1" }}>
          <div
            style={{
              padding: "20px",
              background: "rgba(30, 30, 30, 0.8)",
              borderRadius: "8px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0" }}>Delegation Result</h3>

            {delegationResult ? (
              <>
                <div
                  style={{
                    flex: "1",
                    background: "rgba(0, 0, 0, 0.2)",
                    padding: "10px",
                    borderRadius: "4px",
                    overflowY: "auto",
                    wordBreak: "break-all",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    marginBottom: "15px",
                  }}
                >
                  {delegationResult}
                </div>

                <button
                  onClick={() => copyToClipboard(delegationResult)}
                  style={{
                    padding: "10px",
                    background: "rgba(79, 209, 197, 0.2)",
                    border: "1px solid rgba(79, 209, 197, 0.5)",
                    borderRadius: "5px",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>📋</span>
                  Copy Delegation to Clipboard
                </button>

                <div
                  style={{
                    marginTop: "20px",
                    padding: "15px",
                    background: "rgba(79, 209, 197, 0.1)",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>
                    Instructions for Recipients:
                  </p>
                  <ol style={{ margin: "0", paddingLeft: "20px" }}>
                    <li>Copy the delegation string above</li>
                    <li>Send it securely to the recipient</li>
                    <li>
                      They will need to use this delegation to access your space
                    </li>
                    <li>
                      This delegation is valid for {expirationHours} hours
                    </li>
                  </ol>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "20px",
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>📤</div>
                <p>No delegation has been created yet.</p>
                <p>
                  Fill in the form and click - Create Delegation - to generate a
                  delegation for another user.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "rgba(30, 30, 30, 0.8)",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0" }}>How to Use a Delegation</h3>

        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: "1" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#4fd1c5" }}>
              For Space Owners:
            </h4>
            <ol style={{ paddingLeft: "20px", margin: "0" }}>
              <li>Create a delegation using the form above</li>
              <li>Share the delegation string with the recipient</li>
              <li>
                They&apos;ll be able to upload to your space with the
                permissions you specified
              </li>
              <li>
                You can revoke access by not creating new delegations when the
                current one expires
              </li>
            </ol>
          </div>

          <div style={{ flex: "1" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#4fd1c5" }}>
              For Recipients:
            </h4>
            <ol style={{ paddingLeft: "20px", margin: "0" }}>
              <li>Provide your Agent DID to the space owner</li>
              <li>Receive the delegation string from them</li>
              <li>Use the delegation to access their space</li>
              <li>
                Remember that delegations expire after the time period set by
                the owner
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Import Delegation Form */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "rgba(30, 30, 30, 0.8)",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0" }}>Import a Shared Space</h3>

        <p>
          If someone has shared their space with you, paste the delegation
          string they provided below.
        </p>

        <form onSubmit={handleApplyDelegation}>
          <div className="archive-form-group">
            <label className="archive-form-label">Delegation String</label>
            <textarea
              value={receivedDelegation}
              onChange={(e) => setReceivedDelegation(e.target.value)}
              className="archive-form-input"
              rows={6}
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "white",
              }}
              placeholder="Paste the delegation string here..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isImportingDelegation}
            style={{
              padding: "10px 20px",
              background: "rgba(79, 209, 197, 0.2)",
              border: "1px solid rgba(79, 209, 197, 0.5)",
              borderRadius: "5px",
              color: "white",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              marginTop: "15px",
            }}
          >
            {isImportingDelegation ? (
              <>
                <span className="button-spinner"></span>
                Importing...
              </>
            ) : (
              <>
                <span style={{ fontSize: "16px" }}>🔗</span>
                Connect to Shared Space
              </>
            )}
          </button>
        </form>
      </div>

      {/* Modified Active Delegations Section */}
      {activeDelegations.length > 0 && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "rgba(30, 30, 30, 0.8)",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0" }}>Active Delegations</h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {activeDelegations.map((delegation) => (
              <div
                key={delegation.id}
                style={{
                  padding: "15px",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                    To: {delegation.audienceDid}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>
                    {delegation.abilities.join(", ")}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: calculateTimeRemaining(
                        delegation.expirationTimestamp
                      ).includes("Expired")
                        ? "#ff4444"
                        : "#4fd1c5",
                    }}
                  >
                    {calculateTimeRemaining(delegation.expirationTimestamp)}
                  </div>
                  <button
                    onClick={() => handleRevokeDelegation(delegation.id)}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(255, 68, 68, 0.1)",
                      border: "1px solid rgba(255, 68, 68, 0.3)",
                      borderRadius: "4px",
                      color: "#ff4444",
                      cursor: "pointer",
                      fontSize: "12px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 68, 68, 0.2)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 68, 68, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 68, 68, 0.1)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 68, 68, 0.3)";
                    }}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

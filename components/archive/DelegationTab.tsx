import React from "react";
import { motion } from "framer-motion";
import { DelegationManager } from "./DelegationManager";
import { UploadStatus } from "./types";
import { UserSpace } from "../../contexts/filecoin-context";

interface DelegationTabProps {
  userSpace: UserSpace | null;
  uploadStatus: UploadStatus | null;
  setUploadStatus: (status: UploadStatus | null) => void;
  onRefresh: () => Promise<void>;
}

export const DelegationTab: React.FC<DelegationTabProps> = ({
  userSpace,
  uploadStatus,
  setUploadStatus,
  onRefresh,
}) => {
  const handleDelegationComplete = async () => {
    await onRefresh();
  };

  const handleError = (error: string) => {
    console.error("Delegation error:", error);
    setUploadStatus({
      status: "error",
      message: error,
    });
  };

  if (!userSpace) {
    return (
      <motion.div
        className="archive-auth"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="archive-message error">
          Please connect to a space first to manage delegations
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="archive-delegations"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DelegationManager
        userSpace={userSpace}
        uploadStatus={uploadStatus}
        setUploadStatus={setUploadStatus}
        onDelegationComplete={handleDelegationComplete}
        onError={handleError}
      />
    </motion.div>
  );
};

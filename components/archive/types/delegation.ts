// We don't need to import Delegation directly
// import type { Delegation } from '@web3-storage/w3up-client/delegation';

export interface DelegationCapability {
  can: string;
  with: string;
}

export interface DelegationInfo {
  id: string;
  audience: string;
  expiration: number;
  capabilities: string[];
  proof: string; // Base64 encoded delegation proof
}

export interface DelegationRequest {
  audienceDid: string;
  abilities: string[];
  expirationHours: number;
  spaceDid: string;
  email: string;
}

export interface DelegationResponse {
  success: boolean;
  message?: string;
  delegation?: DelegationInfo;
}

export interface RevocationRequest {
  delegationId: string;
  spaceDid: string;
  email: string;
}

export interface RevocationResponse {
  success: boolean;
  message?: string;
}

// Available delegation capabilities
export const DELEGATION_CAPABILITIES = {
  SPACE: {
    ADD: "space/blob/add",
    LIST: "space/blob/list",
    REMOVE: "space/blob/remove",
    INFO: "space/info",
  },
  UPLOAD: {
    ADD: "upload/add",
    LIST: "upload/list",
    REMOVE: "upload/remove",
  },
  FILECOIN: {
    OFFER: "filecoin/offer",
    INFO: "filecoin/info",
    LIST: "filecoin/list",
  },
} as const;

// Utility to format a delegation for the frontend
// We use more specific types instead of any
export function formatDelegation(delegation: {
  cid: { toString(): string };
  audience: { did(): string };
  expiration: number;
  capabilities: { can: string }[];
  bytes: Uint8Array;
}): DelegationInfo {
  return {
    id: delegation.cid.toString(),
    audience: delegation.audience.did(),
    expiration: delegation.expiration,
    capabilities: Array.isArray(delegation.capabilities)
      ? delegation.capabilities.map((cap) => cap.can)
      : [],
    proof: Buffer.from(delegation.bytes).toString("base64"),
  };
}

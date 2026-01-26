/**
 * Centralized query keys for TanStack Query.
 * Provides type-safe, consistent query key management.
 */

export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },

  // Profile
  profile: {
    all: ["profile"] as const,
    active: () => [...queryKeys.profile.all, "active"] as const,
    byDid: (did: string) => [...queryKeys.profile.all, did] as const,
    handle: (did: string) => [...queryKeys.profile.all, "handle", did] as const,
  },

  // Hypercerts
  hypercerts: {
    all: ["hypercerts"] as const,
    lists: () => [...queryKeys.hypercerts.all, "list"] as const,
    detail: (uri: string) => [...queryKeys.hypercerts.all, uri] as const,
    evidence: (uri: string) =>
      [...queryKeys.hypercerts.all, uri, "evidence"] as const,
    evidenceRecord: (did: string, rkey: string) =>
      [...queryKeys.hypercerts.all, "evidence-record", did, rkey] as const,
    evaluations: (uri: string) =>
      [...queryKeys.hypercerts.all, uri, "evaluations"] as const,
    evaluationRecord: (did: string, rkey: string) =>
      [...queryKeys.hypercerts.all, "evaluation-record", did, rkey] as const,
    measurements: (uri: string) =>
      [...queryKeys.hypercerts.all, uri, "measurements"] as const,
    measurementRecord: (did: string, rkey: string) =>
      [...queryKeys.hypercerts.all, "measurement-record", did, rkey] as const,
  },

  // Organizations
  organizations: {
    all: ["organizations"] as const,
    list: () => [...queryKeys.organizations.all, "list"] as const,
    detail: (did: string) => [...queryKeys.organizations.all, did] as const,
    checkHandle: (handle: string) =>
      [...queryKeys.organizations.all, "check-handle", handle] as const,
    forProfileSwitch: () =>
      [...queryKeys.organizations.all, "profile-switch"] as const,
  },

  // External APIs
  external: {
    bluesky: {
      all: ["external", "bluesky"] as const,
      profile: (actor: string) =>
        [...queryKeys.external.bluesky.all, "profile", actor] as const,
      searchActors: (query: string) =>
        [...queryKeys.external.bluesky.all, "search", query] as const,
    },
    constellation: {
      all: ["external", "constellation"] as const,
      backlinks: (subject: string, source: string) =>
        [...queryKeys.external.constellation.all, "backlinks", subject, source] as const,
    },
  },
} as const;

// Type helper for query keys
export type QueryKeys = typeof queryKeys;

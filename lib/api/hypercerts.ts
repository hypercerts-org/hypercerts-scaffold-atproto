/**
 * Hypercerts API functions
 */

import { apiClientFormData } from "./client";
import type {
  CreateHypercertRequest,
  CreateHypercertResponse,
  AddEvidenceResponse,
  AddLocationResponse,
} from "./types";

/**
 * Create a new hypercert
 */
export async function createHypercert(
  params: CreateHypercertRequest
): Promise<CreateHypercertResponse> {
  const formData = new FormData();
  formData.append("title", params.title);
  formData.append("shortDescription", params.shortDescription);
  formData.append(
    "description",
    params.description ?? params.shortDescription
  );
  formData.append("startDate", params.startDate);
  formData.append("endDate", params.endDate);
  formData.append("rights", JSON.stringify(params.rights));
  formData.append("workScope", JSON.stringify(params.workScope));

  if (params.image) {
    formData.append("image", params.image);
  }

  return apiClientFormData<CreateHypercertResponse>(
    "/api/certs/create",
    formData
  );
}

/**
 * Create hypercert using SDK params directly (from hypercerts-base-form)
 */
export async function createHypercertFromParams(
  params: import("@hypercerts-org/sdk-core").CreateHypercertParams
): Promise<CreateHypercertResponse> {
  const formData = new FormData();
  formData.append("title", params.title);
  formData.append("shortDescription", params.shortDescription);
  formData.append(
    "description",
    params.description ?? params.shortDescription
  );
  formData.append("startDate", params.startDate);
  formData.append("endDate", params.endDate);
  formData.append("rights", JSON.stringify(params.rights));
  formData.append("workScope", JSON.stringify(params.workScope));

  if (params.image) {
    formData.append("image", params.image);
  }

  if (params.contributions) {
    formData.append("contributions", JSON.stringify(params.contributions));
  }

  return apiClientFormData<CreateHypercertResponse>(
    "/api/certs/create",
    formData
  );
}

/**
 * Add evidence to a hypercert
 */
export async function addEvidence(params: {
  title: string;
  shortDescription: string;
  description?: string;
  relationType?: string;
  hypercertUri: string;
  evidenceMode: "link" | "file";
  evidenceUrl?: string;
  evidenceFile?: File;
}): Promise<AddEvidenceResponse> {
  const formData = new FormData();
  formData.append("title", params.title);
  formData.append("shortDescription", params.shortDescription);
  
  if (params.description) {
    formData.append("description", params.description);
  }
  if (params.relationType) {
    formData.append("relationType", params.relationType);
  }
  
  formData.append("hypercertUri", params.hypercertUri);
  formData.append("evidenceMode", params.evidenceMode);

  if (params.evidenceMode === "link" && params.evidenceUrl) {
    formData.append("evidenceUrl", params.evidenceUrl);
  } else if (params.evidenceMode === "file" && params.evidenceFile) {
    formData.append("evidenceFile", params.evidenceFile);
  }

  return apiClientFormData<AddEvidenceResponse>(
    "/api/certs/add-evidence",
    formData
  );
}

/**
 * Add location to a hypercert
 */
export async function addLocation(params: {
  lpVersion: string;
  srs: string;
  locationType: string;
  createdAt: string;
  name?: string;
  description?: string;
  contentMode: "link" | "file";
  locationUrl?: string;
  locationFile?: File;
  hypercertUri: string;
}): Promise<AddLocationResponse> {
  const formData = new FormData();
  formData.append("lpVersion", params.lpVersion);
  formData.append("srs", params.srs);
  formData.append("locationType", params.locationType);
  formData.append("createdAt", params.createdAt);
  formData.append("hypercertUri", params.hypercertUri);
  formData.append("contentMode", params.contentMode);

  if (params.name) {
    formData.append("name", params.name);
  }
  if (params.description) {
    formData.append("description", params.description);
  }

  if (params.contentMode === "link" && params.locationUrl) {
    formData.append("locationUrl", params.locationUrl);
  } else if (params.contentMode === "file" && params.locationFile) {
    formData.append("locationFile", params.locationFile);
  }

  return apiClientFormData<AddLocationResponse>(
    "/api/certs/add-location",
    formData
  );
}

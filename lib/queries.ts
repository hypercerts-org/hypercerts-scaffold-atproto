import { Agent } from "@atproto/api";
import {
  OrgHypercertsClaimActivity,
  OrgHypercertsContextEvaluation,
  OrgHypercertsClaimContribution,
  OrgHypercertsContextAttachment,
  AppCertifiedLocation,
} from "@hypercerts-org/lexicon";
import { Collections } from "@/lib/types";
import { parseAtUri } from "@/lib/utils";
import { assertValidRecord } from "@/lib/record-validation";

export const getRecordWithURI = async <T>(
  uri: string,
  atProtoAgent: Agent,
  fallbackCollection: string,
): Promise<T | null> => {
  if (!atProtoAgent || !uri) return null;

  const parsed = parseAtUri(uri);
  if (!parsed) return null;
  return getRecord<T>(
    parsed.rkey,
    parsed.did,
    atProtoAgent,
    parsed.collection || fallbackCollection,
  );
};

export const getRecord = async <T>(
  rkey: string,
  did: string,
  atProtoAgent: Agent,
  collection: string,
): Promise<T | null> => {
  const response = await atProtoAgent.com.atproto.repo.getRecord({
    repo: did,
    collection: collection,
    rkey: rkey,
  });
  return (response?.data as T) ?? null;
};

export const getHypercert = async (rkey: string, atProtoAgent: Agent) => {
  const data = await atProtoAgent.com.atproto.repo.getRecord({
    repo: atProtoAgent.assertDid,
    collection: Collections.claim,
    rkey,
  });
  return data;
};

export const uploadFile = async (atProtoAgent: Agent, file?: File) => {
  if (file) {
    const blob = new Blob([file!], { type: file?.type });
    const response = await atProtoAgent.com.atproto.repo.uploadBlob(blob);
    return response.data.blob;
  }
};

export const createHypercert = async (
  atProtoAgent: Agent,
  record: OrgHypercertsClaimActivity.Record,
) => {
  assertValidRecord(
    "activity",
    record,
    OrgHypercertsClaimActivity.validateRecord,
  );
  const data = await atProtoAgent.com.atproto.repo.createRecord({
    repo: atProtoAgent.assertDid,
    collection: Collections.claim,
    record,
  });
  return data;
};

export const updateHypercert = async (
  rkey: string,
  atProtoAgent: Agent,
  record: OrgHypercertsClaimActivity.Record,
) => {
  assertValidRecord(
    "activity",
    record,
    OrgHypercertsClaimActivity.validateRecord,
  );
  const data = await atProtoAgent.com.atproto.repo.putRecord({
    rkey,
    repo: atProtoAgent.assertDid,
    collection: Collections.claim,
    record,
  });
  return data;
};

export const createContribution = async (
  atProtoAgent: Agent,
  record: OrgHypercertsClaimContribution.Record,
) => {
  assertValidRecord(
    "contributionDetails",
    record,
    OrgHypercertsClaimContribution.validateRecord,
  );
  const response = await atProtoAgent?.com.atproto.repo.createRecord({
    record,
    collection: Collections.contribution,
    repo: atProtoAgent.assertDid,
  });
  return response;
};

export const createEvaluation = async (
  atProtoAgent: Agent,
  record: OrgHypercertsContextEvaluation.Record,
) => {
  assertValidRecord(
    "evaluation",
    record,
    OrgHypercertsContextEvaluation.validateRecord,
  );
  const response = await atProtoAgent?.com.atproto.repo.createRecord({
    record,
    collection: Collections.evaluation,
    repo: atProtoAgent.assertDid,
  });
  return response;
};

export const createEvidence = async (
  atProtoAgent: Agent,
  record: OrgHypercertsContextAttachment.Record,
) => {
  assertValidRecord(
    "evidence",
    record,
    OrgHypercertsContextAttachment.validateRecord,
  );
  const response = await atProtoAgent.com.atproto.repo.createRecord({
    record,
    collection: Collections.evidence,
    repo: atProtoAgent.assertDid,
  });
  return response;
};

export const createLocation = async (
  atProtoAgent: Agent,
  record: AppCertifiedLocation.Record,
) => {
  assertValidRecord("location", record, AppCertifiedLocation.validateRecord);
  const response = await atProtoAgent.com.atproto.repo.createRecord({
    record,
    collection: Collections.location,
    repo: atProtoAgent.assertDid,
  });
  return response;
};

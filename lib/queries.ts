import { Agent } from "@atproto/api";
import { OrgHypercertsClaimActivity as HypercertClaim } from "@hypercerts-org/lexicon";
import { OrgHypercertsClaimEvaluation as HypercertEvaluation } from "@hypercerts-org/lexicon";
import { OrgHypercertsClaimContributionDetails as HypercertContribution } from "@hypercerts-org/lexicon";
import { OrgHypercertsClaimAttachment as HypercertEvidence } from "@hypercerts-org/lexicon";
import { AppCertifiedLocation as HypercertLocation } from "@hypercerts-org/lexicon";
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
  record: HypercertClaim.Record,
) => {
  assertValidRecord("activity", record, HypercertClaim.validateRecord);
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
  record: HypercertClaim.Record,
) => {
  assertValidRecord("activity", record, HypercertClaim.validateRecord);
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
  record: HypercertContribution.Record,
) => {
  assertValidRecord(
    "contributionDetails",
    record,
    HypercertContribution.validateRecord,
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
  record: HypercertEvaluation.Record,
) => {
  assertValidRecord("evaluation", record, HypercertEvaluation.validateRecord);
  const response = await atProtoAgent?.com.atproto.repo.createRecord({
    record,
    collection: Collections.evaluation,
    repo: atProtoAgent.assertDid,
  });
  return response;
};

export const createEvidence = async (
  atProtoAgent: Agent,
  record: HypercertEvidence.Record,
) => {
  assertValidRecord("evidence", record, HypercertEvidence.validateRecord);
  const response = await atProtoAgent.com.atproto.repo.createRecord({
    record,
    collection: Collections.evidence,
    repo: atProtoAgent.assertDid,
  });
  return response;
};

export const createLocation = async (
  atProtoAgent: Agent,
  record: HypercertLocation.Record,
) => {
  assertValidRecord("location", record, HypercertLocation.validateRecord);
  const response = await atProtoAgent.com.atproto.repo.createRecord({
    record,
    collection: Collections.location,
    repo: atProtoAgent.assertDid,
  });
  return response;
};

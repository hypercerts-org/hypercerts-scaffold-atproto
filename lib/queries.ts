import { Agent } from "@atproto/api";
import * as HypercertClaim from "@/lexicons/types/org/hypercerts/claim/activity";
import * as HypercertEvaluation from "@/lexicons/types/org/hypercerts/claim/evaluation";
import * as HypercertContribution from "@/lexicons/types/org/hypercerts/claim/contribution";
import * as HypercertEvidence from "@/lexicons/types/org/hypercerts/claim/evidence";
import * as HypercertLocation from "@/lexicons/types/app/certified/location";
import { Collections } from "@/lib/types";
import { parseAtUri } from "@/lib/utils";

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
  const response = await atProtoAgent.com.atproto.repo.createRecord({
    record,
    collection: Collections.location,
    repo: atProtoAgent.assertDid,
  });
  return response;
};

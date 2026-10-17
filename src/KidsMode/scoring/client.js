import { constant } from "@common";
import { JAPJI_BANI_ID } from "../data/japji";

// The service takes 3-10 s; this leaves room for a cold start before the one retry.
const TIMEOUT_MS = 45000;

const baseUrl = () => constant.KIDS_SCORING_URL.replace(/\/+$/, "");

export const referenceUrl = (path) => `${baseUrl()}/reference/${path}`;

// "5-10" when contiguous, "5,7" otherwise.
export const formatSeqs = (seqs) => {
  const contiguous = seqs.every((seq, i) => i === 0 || seq === seqs[i - 1] + 1);
  return contiguous && seqs.length > 1 ? `${seqs[0]}-${seqs[seqs.length - 1]}` : seqs.join(",");
};

// A request that never reached the service (offline, cold replica timing out) is retried once.
const send = async (path, init, retries = 1) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { Accept: "application/json", "X-Api-Key": constant.KIDS_SCORING_API_KEY },
      signal: controller.signal,
    });
  } catch (error) {
    if (retries > 0) return send(path, init, retries - 1);
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const getJson = async (path, init) => {
  const response = await send(path, init);
  if (!response.ok) throw new Error(`Scoring service returned ${response.status}`);
  return response.json();
};

let manifest = null;

// Reciters, word clips and star bands; fetched once per session, retried after a failure.
export const fetchManifest = () => {
  manifest =
    manifest ||
    getJson(`/v1/manifest?bani=${JAPJI_BANI_ID}`, { method: "GET" }).catch((error) => {
      manifest = null;
      throw error;
    });
  return manifest;
};

export const scoreRecording = async (fileUri, { reciter, seqs, optedIn }) => {
  // Audio leaves the phone only after a parent turns on the online check.
  if (!optedIn) return { status: "opted_out" };
  const form = new FormData();
  form.append("bani", String(JAPJI_BANI_ID));
  form.append("reciter", reciter);
  form.append("seqs", formatSeqs(seqs));
  form.append("audio", { uri: fileUri, name: "recitation.m4a", type: "audio/mp4" });
  return getJson("/v1/score", { method: "POST", body: form });
};

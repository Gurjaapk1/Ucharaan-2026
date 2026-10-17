import { fetchManifest, formatSeqs, referenceUrl, scoreRecording } from "./client";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    constant: { KIDS_SCORING_URL: "https://score.example/", KIDS_SCORING_API_KEY: "key-1" },
  });
});
jest.mock("../data/japji", () => ({ JAPJI_BANI_ID: 2 }));

// React Native's FormData takes {uri, name, type} file parts; Node's does not, so record appends.
class MockFormData {
  parts = {};

  append(name, value) {
    this.parts[name] = value;
  }
}
global.FormData = MockFormData;

const ok = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const opts = { reciter: "ggs", seqs: [5, 6, 7, 8, 9, 10], optedIn: true };

describe("scoring client", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => ok({ status: "ok", lines: [], focus: null }));
  });

  it("formats seqs as a range when contiguous", () => {
    expect(formatSeqs([5, 6, 7])).toBe("5-7");
    expect(formatSeqs([5, 7])).toBe("5,7");
  });

  it("builds reference clip URLs", () => {
    expect(referenceUrl("ggs/5/words/0.wav")).toBe(
      "https://score.example/reference/ggs/5/words/0.wav"
    );
  });

  it("posts the recording with bani, reciter, seqs and the API key", async () => {
    const body = await scoreRecording("file:///docs/kids/pauri-1.m4a", opts);
    expect(body.status).toBe("ok");
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe("https://score.example/v1/score");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Api-Key"]).toBe("key-1");
    const { parts } = init.body;
    expect(parts.bani).toBe("2");
    expect(parts.reciter).toBe("ggs");
    expect(parts.seqs).toBe("5-10");
    expect(parts.audio.uri).toBe("file:///docs/kids/pauri-1.m4a");
  });

  it("does not upload without the parent's opt-in", async () => {
    expect(await scoreRecording("file:///x.m4a", { ...opts, optedIn: false })).toEqual({
      status: "opted_out",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("retries once when the request does not reach the service", async () => {
    global.fetch
      .mockImplementationOnce(() => Promise.reject(new Error("offline")))
      .mockImplementationOnce(() => ok({ status: "unclear", lines: [], focus: null }));
    expect((await scoreRecording("file:///x.m4a", opts)).status).toBe("unclear");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects an error status without retrying", async () => {
    global.fetch.mockImplementation(() => Promise.resolve({ ok: false, status: 401 }));
    await expect(scoreRecording("file:///x.m4a", opts)).rejects.toThrow("401");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("fetches the manifest once, and again after a failure", async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error("offline")));
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error("offline")));
    await expect(fetchManifest()).rejects.toThrow("offline");
    global.fetch.mockImplementation(() => ok({ bani: 2, star_bands: [50, 75, 90] }));
    await fetchManifest();
    await fetchManifest();
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[2][0]).toBe("https://score.example/v1/manifest?bani=2");
  });
});

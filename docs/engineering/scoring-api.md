# Scoring API

The native client calls the service directly. The Site browser uses the same paths prefixed with `/api/scoring`; the Worker adds `X-Api-Key` from its runtime secret.

| Route | Purpose |
| --- | --- |
| `GET /healthz` | Process/model readiness, returns the model name |
| `GET /v1/manifest?bani=2` | Reciters and star bands; the current server's word-clip map is empty |
| `POST /v1/score` | Score a completed line or line range |
| `POST /v1/follow` | Locate progress in partial audio; not used to auto-advance the current manual challenge |

## Score request

Send multipart fields `audio`, `bani=2`, `reciter=bjs`, and `seqs`. The service accepts `ggs`, `bjs`, and `imk`; the current app defaults to `bjs`, matching its reference playback. The first line of Pauri 1 is sequence 5. A range can span at most 30 lines, so sending a single line is both simpler and faster.

```json
{
  "status": "ok",
  "lines": [{
    "seq": 5,
    "share_like": 0.75,
    "words": [
      {"idx": 0, "state": "like", "reasons": []},
      {"idx": 1, "state": "check", "reasons": ["gop"]}
    ]
  }],
  "focus": {"seq": 5, "idx": 1}
}
```

This is a shape example, not a complete scored line. `idx` is the service's zero-based word index. The client maps it back to rendered Gurmukhi, preserving punctuation as separators. `share_like` is the fraction of judged words marked `like`; `unclear` words are excluded. No judged words produce zero, and the response status tells the client whether to retry rather than award a score.

## Outcomes

- `like`: the model's heuristic comparison is within tolerance of the reference.
- `check`: a word merits listening and another attempt; it is not proof that a child spoke incorrectly.
- `unclear`: insufficient or poorly aligned audio. The UI should prompt another attempt.
- HTTP 401: missing or invalid deployment key.
- HTTP 400: invalid reciter or sequence range.
- HTTP 422: decoding or inference failed.
- Timeouts/network errors: retry the current line, retaining successful prior lines.

The current client timeout is 45 seconds. The Worker limits declared upload size to 25 MB; the service still needs its own body/duration/concurrency controls before an untrusted public rollout. Do not rely on client-side limits alone.

# Validation and evidence limits

Run the commands in the root README. `native-host/check-rewards.mjs` transpiles the native modules and runs eleven shared tests covering star boundaries, non-farmable coin awards, per-slot equipment, story/milestone unlocks, malformed saves, and migration. The Worker tests verify route rejection, origin checks, missing configuration, and forwarding.

`demo-server/tests/test_audio_lifecycle.py` extracts the actual HTTP endpoint functions and injects a fake scorer, without downloading a model. It verifies that temporary request files are removed after success and failure, and unauthorized calls do not invoke inference. This is a lifecycle test, not an ML accuracy test.

The current Site previously passed browser checks for purchases, reload persistence, demo-wallet isolation, pronunciation aids, Gurmukhi recall selection, and six-region navigation. A controlled browser audio stream reached the Azure model in earlier testing. A real child's pronunciation and physical-device microphone were not validated by those checks.

Before production, use the held-out learner evaluation and deployment checks in [the ML guide](ml-production.md). The submission package preserves known limits rather than presenting sample scores as measured learning outcomes.

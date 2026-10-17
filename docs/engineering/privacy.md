# Privacy and audio lifecycle

## Current hosted path

The child explicitly starts a recording. On Done, the current line is sent to the team's private scoring deployment. Web traffic passes through the Site Worker; native traffic uses its configured service endpoint. The Python code runs local model inference, not a public model inference API. No training pipeline receives child recordings in this implementation.

`demo_server.py` reads the upload, creates a temporary audio file for ffmpeg decoding, and deletes that file in `finally` after scoring or a scoring exception. Its request logs contain timing, reciter, sequence range, status, and failure details, not a deliberate archive of recordings. The reference cache contains the ustaad's precomputed values, not children's uploads.

Use this accurate description in public material: **Recordings are processed privately; temporary server recordings are deleted after processing, and are not used for model training.** Do not describe this code as purely in-memory or instant secure erasure.

## What deletion does and does not establish

The deletion tests exercise the application's temporary-file lifecycle on both successful and failing requests. They do not audit the current Azure deployment, infrastructure logs, filesystem snapshots, or byte-level memory erasure. FastAPI multipart uploads may spool before endpoint execution. `os.unlink` removes a file entry; it does not promise forensic overwrite. Abnormal process termination can bypass Python cleanup.

Before production, configure ephemeral or memory-backed temporary storage, disable audio/body logging and crash-dump capture, verify multipart spool cleanup, and test container termination and restart. Do not mount upload directories into backups. Keep only operational metrics needed to run the service.

Expo's recorder also produces a local URI. The current app does not persist recordings in progress storage, but it does not implement a verified cross-platform recorder-cache purge. Add and device-test explicit cleanup on completion, retry, cancellation, and unmount before promising end-to-end zero retention. Do not delete a URI until its upload has completed.

## Khalis-owned hosting

The same container can be operated in Khalis's own Azure, AWS, or shared private environment. Restrict ingress, authenticate callers, encrypt traffic, and keep keys in the platform secret store. A public HTTPS hostname with an API key is not a private network boundary. The team's statement that its deployment is private has not been independently audited here.

A former shared demo key existed in Git history. Removing it from this submission tree does not revoke it. The deployment owner must rotate it before production; the handover does not silently change the working demo's credentials.

## Fully local processing

On-device packaging is another deployment option that keeps recordings on the device. The selected model already has an ONNX export, but this app does not yet run that export on device. It needs a mobile runtime, matching audio preprocessing and alignment, reference assets, and measured memory/latency/battery behavior. The existing MFCC/DTW path is a different experimental scorer and must not be presented as equivalent.

A fully offline mode should make no scoring upload, work in airplane mode, and test local cache cleanup. Local processing and local deletion are separate requirements.

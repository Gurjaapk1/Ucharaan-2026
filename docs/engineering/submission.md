# Submission package

The code package includes the full current native app, Site adapter, Python scoring service, historical prototype source, project documentation, license/notices, and placeholder environment examples. It excludes dependencies, downloaded model weights, downloaded reciter audio, caches, Git history, build output, and generated videos.

From the repository root after installing the app dependencies:

```sh
python3 scripts/check_submission.py
python3 scripts/package_submission.py
```

The output is `tmp/Team12_Code.zip`. Its `SUBMISSION_MANIFEST.json` records the source commit and SHA-256 of every included file. The current one-pager is kept under `outputs/final-guide/Team12_Final.pdf` and is also included in the ZIP when tracked.

The official upload is still a separate human action. Place the final PDF, demo MP4, and code ZIP in the team Google Drive folder specified by the organizers. A Loom link in the PDF does not replace an MP4 if the organizers require the video file. No Drive sharing is performed by these scripts.

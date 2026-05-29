# DSA Sync: Architectural Guide

This document provides a guided tour of the codebase to help you understand how the extension works from end-to-end.

## Core Flow: From Submission to GitHub

To understand the architecture, read the files in the following order:

### 1. The Interceptor (`dsasync/contents/interceptor.ts`)
**Start here.** This script is the "ear" of the extension. It runs directly inside the LeetCode page context.
- **What it does:** It wraps the global `window.fetch` function.
- **The Magic:** It listens for network requests to `/check/`. When LeetCode asks its servers "Is this submission accepted?", our interceptor catches the answer. If it's "Accepted", it sends a `window.postMessage` to the rest of the extension.

### 2. The Content Script (`dsasync/contents/leetcode.ts`)
This is the "bridge" between the page and the extension.
- **What it does:** It listens for the message from the Interceptor.
- **Data Gathering:** Once notified of a successful submission, it uses LeetCode's GraphQL API to fetch the full details (code, language, runtime, difficulty).
- **Communication:** It uses `sendToBackground` to pass all this data to the background service worker.

### 3. The Background Worker (`dsasync/background/messages/SUBMISSION_DETECTED.ts`)
This is the "engine" that handles the heavy lifting.
- **What it does:** It receives the submission data.
- **GitHub Sync:** It uses the GitHub API (`lib/github.ts`) to:
    1. Check if the file already exists (to handle multiple attempts).
    2. Upload the solution file.
    3. Update the category-specific `README.md`.
    4. Update the root `README.md`.
- **State Management:** It updates the local storage with new stats and streaks.

### 4. The Library Utilities (`dsasync/lib/`)
These are the specialized tools used by the scripts above:
- `github.ts`: Handles all communication with the GitHub API.
- `leetcode.ts`: Contains the logic to parse raw GraphQL data into a clean object.
- `utils.ts`: The "Swiss Army Knife" for formatting README rows, file headers, and extension mappings. This also contains the logic to "re-sync" stats by parsing the README.

### 5. The UI (`dsasync/popup.tsx`)
The dashboard you see when you click the extension icon.
- **What it does:** Displays your streak, stats, and provides the settings to connect your GitHub account via Device Flow OAuth.

---

## Summary of Data Flow
1. **Intercept** (`interceptor.ts`) -> 2. **Fetch Details** (`leetcode.ts`) -> 3. **Process & Upload** (`SUBMISSION_DETECTED.ts`) -> 4. **Update UI Storage** (`popup.tsx`).

## Key Technologies
- **Plasmo:** The framework used to build the extension.
- **Tailwind CSS:** Used for styling the popup.
- **Lucide React:** Icon library for the UI.
- **GitHub API:** For repository synchronization.

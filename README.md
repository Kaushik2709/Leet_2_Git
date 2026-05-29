# DSA Sync - LeetCode to GitHub Extension

A Chrome extension built with Plasmo that automatically pushes your accepted LeetCode solutions to a GitHub repository.

## Features
*   **Automatic Sync:** Pushes code immediately after an "Accepted" submission.
*   **OAuth Login:** Secure "Login with GitHub" using Device Flow.
*   **Detailed Stats:** Track your streak, weekly progress, and problem difficulty distribution.
*   **README Automation:** Updates repository READMEs with a dashboard of your progress.

## Setup Instructions

### 1. Prerequisites
*   Node.js (v18+)
*   Brave/Chrome Browser

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. **App Name:** `DSA Sync`
4. **Homepage URL:** `https://leetcode.com`
5. **Authorization callback URL:** `https://<YOUR_EXTENSION_ID>.chromiumapp.org/`
   * To find your Extension ID: Go to `chrome://extensions`, load the extension, and copy the ID string.
6. Copy the **Client ID** and paste it into `dsasync/.env`:
   `PLASMO_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here`

### 4. Build and Load
```bash
npm run build
```
1. Open `chrome://extensions` in your browser.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `dsasync/build/chrome-mv3-prod`.

### 5. Configure
1. Click the **DSA Sync** icon.
2. Click **Login with GitHub**.
3. Enter the 8-digit code on GitHub.
4. Provide your **Full GitHub Repository URL** (e.g., `https://github.com/Kaushik2709/DSA`).
5. Set your target folder (e.g., `DSA/`).
6. Click **Finish Setup**.

## Development
To run in watch mode:
```bash
npm run dev
```

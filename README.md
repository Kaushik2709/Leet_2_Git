# 🚀 DSA Sync: LeetCode to GitHub Automated Bridge

**DSA Sync** is a sophisticated Chrome extension that streamlines your coding journey by automatically synchronizing your "Accepted" LeetCode submissions to a dedicated GitHub repository. It handles code extraction, formatting, and README documentation in real-time.

---

## 🛠️ The Tech Stack

- **Framework:** [Plasmo](https://www.plasmo.com/) (Browser Extension Framework for MV3)
- **Frontend:** React 18, Tailwind CSS, Lucide React (Icons)
- **Language:** TypeScript
- **API Integrations:** 
  - **LeetCode GraphQL API** (Detailed problem metadata extraction)
  - **GitHub REST API** (Repository management & File synchronization)
  - **GitHub Device Flow OAuth** (Secure, CLI-like authentication)
- **Storage:** Plasmo Storage (Synchronized browser state)

---

## 🏗️ How It Works (E2E Workflow)

The extension operates through a multi-layered architectural approach to ensure reliability and performance:

1.  **Network Interception:** A specialized `interceptor.ts` script monkey-patches the global `window.fetch` within the LeetCode page context. It detects specific network responses (requests to `/check/`) that signify a successful "Accepted" submission.
2.  **Data Extraction:** Once a submission is detected, a content script (`leetcode.ts`) triggers a GraphQL query to LeetCode's internal API. This fetches rich metadata: the actual code, runtime performance, memory usage, difficulty level, and topic tags.
3.  **Background Processing:** The extracted data is passed via secure messaging to a Background Service Worker (`SUBMISSION_DETECTED.ts`). This worker operates independently of the UI, ensuring that the sync process completes even if the tab is closed.
4.  **GitHub Synchronization:** 
    - **Collision Handling:** Checks if the solution already exists to decide between a `POST` or `PUT` request.
    - **Documentation Engine:** Automatically updates two READMEs—the root dashboard and a category-specific (e.g., `Arrays/`, `Dynamic Programming/`) README—maintaining an organized table of your progress.
5.  **Analytics & UI:** A React-powered popup dashboard tracks your solving streaks, difficulty distribution (Easy/Medium/Hard), and weekly progress by reading from synchronized browser storage.

---

## ✨ Key Features & Engineering Highlights

- **Zero-Config Sync:** Once set up, the extension works silently in the background. No manual triggers required.
- **GitHub Device Flow Auth:** Implemented a secure "Device Code" authentication flow, removing the need for users to manually input sensitive Personal Access Tokens (PATs).
- **Automated Dashboarding:** Beyond just saving code, it builds a professional portfolio by updating your repository's README with formatted tables and performance stats.
- **Reliable Networking:** Built with custom retry logic and exponential backoff to handle GitHub API rate limits (HTTP 429).
- **Type-Safe Architecture:** Fully written in TypeScript with shared interfaces across content scripts, background workers, and the UI.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A GitHub account and a target repository.

### Installation
1.  **Clone & Install:**
    ```bash
    git clone https://github.com/Kaushik2709/DSA_Sync.git
    cd DSA_Sync/leet_2_git
    npm install
    ```
2.  **Environment Setup:** Create a `.env` file and add your GitHub OAuth Client ID:
    ```env
    PLASMO_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
    ```
3.  **Build:**
    ```bash
    npm run build
    ```
4.  **Load Extension:**
    - Go to `chrome://extensions`
    - Enable **Developer mode**
    - Click **Load unpacked** and select the `build/chrome-mv3-prod` folder.

---

## 👨‍💻 Author

**Kaushik Mukherjee**
- GitHub: [@Kaushik2709](https://github.com/Kaushik2709)
- Project Repository: [DSA_Sync](https://github.com/Kaushik2709/DSA_Sync)

---

*Built with ❤️ for the LeetCode community.*

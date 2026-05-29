import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// Initialize config if it doesn't exist
chrome.runtime.onInstalled.addListener(async () => {
  const config = await storage.get("config")
  if (!config) {
    await storage.set("config", {
      githubToken: "",
      repoName: "",
      folderPath: "DSA/",
      isEnabled: true
    })
  }
})

console.log("DSA Sync: Background service worker initialized.")

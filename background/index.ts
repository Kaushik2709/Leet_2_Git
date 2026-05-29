import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// Initialize config if it doesn't exist
chrome.runtime.onInstalled.addListener(async () => {
  const config = await storage.get("config")
  if (!config) {
    await storage.set("config", {
      accessToken: "",
      repoUrl: "",
      repoName: "",
      folderPath: "DSA/",
      isEnabled: true,
      stats: { Easy: 0, Medium: 0, Hard: 0, Total: 0 },
      streak: 0,
      weeklyHistory: []
    })
  }
})

console.log("DSA Sync: Background service worker initialized.")

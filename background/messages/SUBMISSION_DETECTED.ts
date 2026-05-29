import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import { parseSubmission } from "~lib/leetcode"
import { pushFile, getFileContent } from "~lib/github"
import { buildFileHeader, getFileExtension, buildReadmeRow, updateReadmeContent } from "~lib/utils"
import type { ExtensionConfig } from "~types"

const storage = new Storage()

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const config = await storage.get<ExtensionConfig>("config")
  
  if (!config || !config.isEnabled || !config.githubToken || !config.repoName) {
    console.log("DSA Sync: Missing configuration or sync disabled.")
    return
  }

  const submission = parseSubmission(req.body)
  const extension = getFileExtension(submission.language)
  const baseFileName = `${submission.problemNumber}_${submission.titleSlug}`
  
  // Create folder path based on tags or default to General
  const category = submission.tags[0] || "General"
  const folderPath = config.folderPath ? (config.folderPath.endsWith("/") ? config.folderPath : config.folderPath + "/") : ""
  
  const githubConfig = {
    token: config.githubToken,
    repo: config.repoName
  }

  // Check if file already exists to handle attempts
  let finalFileName = `${baseFileName}${extension}`
  let attempt = 1
  
  while (true) {
    const checkPath = `${folderPath}${category}/${finalFileName}`
    const existingContent = await getFileContent(checkPath, githubConfig)
    
    if (!existingContent) break // File doesn't exist, use this name
    
    // If it exists, check if the code is identical (optional, but let's just increment attempt)
    // To keep it simple as per requirements: "name as _attempt2, _attempt3"
    attempt++
    finalFileName = `${baseFileName}_attempt${attempt}${extension}`
    
    // Safety break
    if (attempt > 10) break
  }

  const fullPath = `${folderPath}${category}/${finalFileName}`

  // Build file content
  const header = buildFileHeader(submission)
  const fullContent = header + submission.code

  // 1. Push the solution file
  const pushSuccess = await pushFile(fullPath, fullContent, `Add solution for ${submission.title}`, githubConfig)

  if (pushSuccess) {
    // 2. Update category README
    const categoryReadmePath = `${folderPath}${category}/README.md`
    const categoryReadmeContent = await getFileContent(categoryReadmePath, githubConfig) || ""
    const newRow = buildReadmeRow(submission, finalFileName)
    const updatedCategoryReadme = updateReadmeContent(categoryReadmeContent, newRow)
    await pushFile(categoryReadmePath, updatedCategoryReadme, `Update README for ${category}`, githubConfig)

    // 3. Update root README
    const rootReadmePath = `${folderPath}README.md`
    const rootReadmeContent = await getFileContent(rootReadmePath, githubConfig) || ""
    // Use relative path from root to file
    const rootNewRow = buildReadmeRow(submission, `${category}/${finalFileName}`)
    const updatedRootReadme = updateReadmeContent(rootReadmeContent, rootNewRow)
    await pushFile(rootReadmePath, updatedRootReadme, "Update root README", githubConfig)

    // 4. Update last synced in storage
    await storage.set("config", {
      ...config,
      lastSynced: submission
    })

    // 5. Show notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icon.png",
      title: "DSA Sync: Success!",
      message: `✅ ${submission.problemNumber}. ${submission.title} pushed to GitHub!`
    })
  } else {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icon.png",
      title: "DSA Sync: Error",
      message: `❌ Failed to push ${submission.title} to GitHub.`
    })
  }

  res.send({ success: pushSuccess })
}

export default handler

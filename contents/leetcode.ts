import type { PlasmoCSConfig } from "plasmo"
import { sendToBackground } from "@plasmohq/messaging"
import interceptorUrl from "url:./interceptor.ts"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/problems/*"]
}

// Inject the interceptor script
const script = document.createElement("script")
script.src = interceptorUrl
script.onload = () => script.remove()
;(document.head || document.documentElement).appendChild(script)

async function fetchSubmissionDetails(submissionId: string) {
  const query = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        runtimeDisplay
        runtimePercentile
        memoryDisplay
        memoryPercentile
        code
        lang {
          name
          verboseName
        }
        question {
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
        }
        statusDisplay
      }
    }
  `

  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1]

  try {
    const response = await fetch("https://leetcode.com/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrftoken": csrfToken || ""
      },
      body: JSON.stringify({
        query,
        variables: { submissionId: parseInt(submissionId) }
      })
    })

    const result = await response.json()
    return result.data.submissionDetails
  } catch (error) {
    console.error("DSA Sync: Error fetching submission details:", error)
    return null
  }
}

// Listen for messages from the injected script
window.addEventListener("message", async (event) => {
  if (event.source !== window) return

  if (event.data.type === "LEETCODE_SUBMISSION_ACCEPTED") {
    const { submissionId } = event.data.payload
    console.log("DSA Sync: Submission accepted! ID:", submissionId)
    
    const details = await fetchSubmissionDetails(submissionId)
    if (details) {
      console.log("DSA Sync: Details fetched, sending to background...")
      await sendToBackground({
        name: "SUBMISSION_DETECTED",
        body: details
      })
    }
  }
})

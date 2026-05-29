import type { PlasmoCSConfig } from "plasmo"
import { sendToBackground } from "@plasmohq/messaging"
import interceptorUrl from "url:./interceptor.ts"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/problems/*"],
  run_at: "document_start"
}

// Inject the interceptor script as early as possible
function injectInterceptor() {
  if (document.getElementById("dsa-sync-interceptor")) return

  const script = document.createElement("script")
  script.id = "dsa-sync-interceptor"
  script.src = interceptorUrl
  
  // Try to inject into documentElement if head doesn't exist yet
  const target = document.head || document.documentElement
  if (target) {
    target.appendChild(script)
    console.log("DSA Sync: Interceptor injected successfully via", target.tagName)
  } else {
    // Fallback if neither exist (extremely unlikely at document_start but just in case)
    const observer = new MutationObserver(() => {
      const newTarget = document.head || document.documentElement
      if (newTarget) {
        newTarget.appendChild(script)
        console.log("DSA Sync: Interceptor injected successfully via Observer")
        observer.disconnect()
      }
    })
    observer.observe(document, { childList: true, subtree: true })
  }
}

injectInterceptor()

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

// Listen for messages from the interceptor script (which runs in the MAIN world)
const handleMessage = async (event: MessageEvent) => {
  if (event.source !== window) return

  if (event.data.type === "LEETCODE_SUBMISSION_ACCEPTED") {
    const { submissionId } = event.data.payload
    console.log("DSA Sync: Message received from page! Submission ID:", submissionId)
    
    // Check if extension context is valid before proceeding
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
      console.warn("DSA Sync: Extension context invalidated. Removing listener. Please refresh the page.")
      window.removeEventListener("message", handleMessage)
      return
    }

    const details = await fetchSubmissionDetails(submissionId)
    if (details) {
      console.log("DSA Sync: Details fetched, sending to background...")
      try {
        await sendToBackground({
          name: "SUBMISSION_DETECTED",
          body: details
        })
      } catch (error: any) {
        if (error?.message?.includes("Extension context invalidated")) {
          console.warn("DSA Sync: Extension context invalidated caught during send. Removing listener. Please refresh the page.")
          window.removeEventListener("message", handleMessage)
        } else {
          console.error("DSA Sync: Error sending to background:", error)
        }
      }
    }
  }
}

window.addEventListener("message", handleMessage)

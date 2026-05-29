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

// Listen for messages from the injected script
window.addEventListener("message", async (event) => {
  if (event.source !== window || event.data.type !== "LEETCODE_SUBMISSION") {
    return
  }

  const submissionData = event.data.payload
  if (submissionData.statusDisplay === "Accepted") {
    console.log("DSA Sync: Accepted submission detected!", submissionData)
    
    // Send to background for processing
    await sendToBackground({
      name: "SUBMISSION_DETECTED",
      body: submissionData
    })
  }
})

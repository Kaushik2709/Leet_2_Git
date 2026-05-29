// This script runs in the page context to intercept fetch calls
;(function () {
  console.log("DSA Sync: Interceptor script loaded and running.")
  const originalFetch = window.fetch

  window.fetch = async (...args) => {
    const response = await originalFetch(...args)
    
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '')
      
      // Broadened check for LeetCode submission status
      if (url && url.includes('/check/')) {
        console.log("DSA Sync: Potential submission check detected:", url)
        
        // Match both old and new URL formats, including /v2/check/
        const match = url.match(/\/submissions\/detail\/(\d+)\/(?:v2\/)?check/) || url.match(/\/check\/(\d+)/)
        
        if (match) {
          const submissionId = match[1]
          console.log("DSA Sync: Found Submission ID:", submissionId)
          
          const clone = response.clone()
          clone.json().then(body => {
            console.log("DSA Sync: Submission response received:", body.state, body.status_msg)
            if (body.state === 'SUCCESS' && body.status_msg === 'Accepted') {
              console.log("DSA Sync: Submission ACCEPTED! Notifying extension...")
              window.postMessage({
                type: "LEETCODE_SUBMISSION_ACCEPTED",
                payload: { submissionId }
              }, "*")
            }
          }).catch(e => {
            console.error("DSA Sync: Error parsing submission JSON", e)
          })
        }
      }
    } catch (e) {
      // ignore
    }
    
    return response
  }
  console.log("DSA Sync: window.fetch successfully wrapped.")
})()

// This script runs in the page context to intercept fetch calls
;(function () {
  const originalFetch = window.fetch

  window.fetch = async (...args) => {
    const response = await originalFetch(...args)
    
    if (typeof args[0] === 'string' && args[0].includes('graphql')) {
      const clone = response.clone()
      try {
        const body = await clone.json()
        
        // Check if it's a submission details query
        if (body.data?.submissionDetails) {
          window.postMessage({
            type: "LEETCODE_SUBMISSION",
            payload: body.data.submissionDetails
          }, "*")
        }
      } catch (e) {
        // Not a JSON or not what we want
      }
    }
    
    return response
  }
})()

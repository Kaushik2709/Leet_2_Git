// This script runs in the page context to intercept fetch calls
;(function () {
  const originalFetch = window.fetch

  window.fetch = async (...args) => {
    const response = await originalFetch(...args)
    
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '')
      
      // Intercept LeetCode submission check
      if (url && url.includes('/check/')) {
        const match = url.match(/\/submissions\/detail\/(\d+)\/check/)
        if (match) {
          const submissionId = match[1]
          const clone = response.clone()
          
          clone.json().then(body => {
            if (body.state === 'SUCCESS' && body.status_msg === 'Accepted') {
              window.postMessage({
                type: "LEETCODE_SUBMISSION_ACCEPTED",
                payload: { submissionId }
              }, "*")
            }
          }).catch(e => {})
        }
      }
    } catch (e) {
      // ignore
    }
    
    return response
  }
})()

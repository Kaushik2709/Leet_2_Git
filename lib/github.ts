export interface GitHubConfig {
  token: string
  repo: string
}

export function parseRepoUrl(url: string): string | null {
  try {
    const cleanUrl = url.replace(/\/$/, "")
    const parts = cleanUrl.split("/")
    if (parts.length >= 2) {
      const repo = parts.pop()
      const owner = parts.pop()
      if (owner && repo) {
        return `${owner}/${repo}`
      }
    }
    return null
  } catch (e) {
    return null
  }
}

export async function getFileSHA(path: string, config: GitHubConfig): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${config.repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github.v3+json"
      }
    })
    if (response.status === 200) {
      const data = await response.json()
      return data.sha
    }
    return null
  } catch (error) {
    console.error("Error getting file SHA:", error)
    return null
  }
}

export async function pushFile(
  path: string,
  content: string,
  message: string,
  config: GitHubConfig
): Promise<boolean> {
  const sha = await getFileSHA(path, config)
  
  try {
    const response = await fetch(`https://api.github.com/repos/${config.repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        sha: sha || undefined
      })
    })

    if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return pushFile(path, content, message, config)
    }

    return response.ok
  } catch (error) {
    console.error("Error pushing file to GitHub:", error)
    return false
  }
}

export async function getFileContent(path: string, config: GitHubConfig): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${config.repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github.v3+json"
      }
    })
    if (response.status === 200) {
      const data = await response.json()
      return decodeURIComponent(escape(atob(data.content)))
    }
    return null
  } catch (error) {
    console.error("Error getting file content:", error)
    return null
  }
}

// GitHub Device Flow Auth Helpers
const CLIENT_ID = process.env.PLASMO_PUBLIC_GITHUB_CLIENT_ID || ""

export async function initiateDeviceFlow() {
  const response = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: "repo"
    })
  })
  return response.json()
}

export async function pollForToken(deviceCode: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code"
    })
  })
  return response.json()
}

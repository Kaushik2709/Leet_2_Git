export interface LeetCodeSubmission {
  problemNumber: number
  title: string
  titleSlug: string
  difficulty: "Easy" | "Medium" | "Hard"
  language: string
  code: string
  runtime: string
  runtimePercentile: number
  memory: string
  memoryPercentile: number
  tags: string[]
  url: string
  submittedAt: string
}

export interface ExtensionConfig {
  githubToken: string
  repoName: string
  folderPath: string
  isEnabled: boolean
  lastSynced?: LeetCodeSubmission
}

export type MessageType = "SUBMISSION_DETECTED" | "GET_CONFIG" | "SET_CONFIG"

export interface Message {
  type: MessageType
  payload?: any
}

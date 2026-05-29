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

export interface Stats {
  Easy: number
  Medium: number
  Hard: number
  Total: number
}

export interface ExtensionConfig {
  accessToken: string
  repoUrl: string // Full URL: https://github.com/user/repo
  repoName: string // Parsed: user/repo
  folderPath: string
  isEnabled: boolean
  lastSynced?: LeetCodeSubmission
  stats: Stats
  streak: number
  lastSolveDate?: string
  weeklyHistory: string[]
}

export type MessageType = "SUBMISSION_DETECTED" | "GET_CONFIG" | "SET_CONFIG"

export interface Message {
  type: MessageType
  payload?: any
}

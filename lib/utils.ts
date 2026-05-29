import type { LeetCodeSubmission } from "~types"

export const LANGUAGE_MAP: Record<string, string> = {
  cpp: ".cpp",
  java: ".java",
  python: ".py",
  python3: ".py",
  c: ".c",
  csharp: ".cs",
  javascript: ".js",
  typescript: ".ts",
  php: ".php",
  swift: ".swift",
  kotlin: ".kt",
  dart: ".dart",
  golang: ".go",
  ruby: ".rb",
  scala: ".scala",
  rust: ".rs",
  mysql: ".sql",
  mssql: ".sql",
  oraclesql: ".sql",
  pythondata: ".py",
  elixir: ".ex",
  erlang: ".erl",
  racket: ".rkt"
}

export function getFileExtension(language: string): string {
  return LANGUAGE_MAP[language.toLowerCase()] || ".txt"
}

export function getCommentStyle(language: string): { start: string; end?: string; line: string } {
  const lang = language.toLowerCase()
  if (["python", "python3", "ruby", "pythondata"].includes(lang)) {
    return { line: "#" }
  }
  if (["mysql", "mssql", "oraclesql"].includes(lang)) {
    return { line: "--" }
  }
  return { line: "//" }
}

export function buildFileHeader(submission: LeetCodeSubmission): string {
  const { line } = getCommentStyle(submission.language)
  return [
    `${line} Problem   : ${submission.problemNumber}. ${submission.title}`,
    `${line} Difficulty: ${submission.difficulty}`,
    `${line} Link      : ${submission.url}`,
    `${line} Runtime   : ${submission.runtime} (beats ${submission.runtimePercentile.toFixed(1)}%)`,
    `${line} Memory    : ${submission.memory} (beats ${submission.memoryPercentile.toFixed(1)}%)`,
    `${line} Submitted : ${submission.submittedAt}`,
    `${line} Tags      : ${submission.tags.join(", ") || "General"}`,
    ""
  ].join("\n")
}

export function buildReadmeRow(submission: LeetCodeSubmission, filePath: string): string {
  return `| ${submission.problemNumber} | [${submission.title}](${submission.url}) | [${submission.language}](./${filePath}) | ${submission.difficulty} | ${submission.submittedAt} |`
}

export const README_HEADER = `| # | Title | Solution | Difficulty | Date |
|---|-------|----------|------------|------|`

export function updateReadmeContent(currentContent: string, newRow: string): string {
  if (!currentContent.includes("| # | Title |")) {
    return `${README_HEADER}\n${newRow}`
  }
  
  const lines = currentContent.split("\n")
  const headerIndex = lines.findIndex(line => line.includes("| # | Title |"))
  
  // Check if problem already exists in README to avoid duplicates
  const problemId = newRow.split("|")[1].trim()
  const existingIndex = lines.findIndex(line => line.startsWith(`| ${problemId} |`))
  
  if (existingIndex !== -1) {
    lines[existingIndex] = newRow
    return lines.join("\n")
  }

  // Insert at the end of the table
  return [...lines, newRow].join("\n")
}

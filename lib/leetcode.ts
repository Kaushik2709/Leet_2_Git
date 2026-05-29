import type { LeetCodeSubmission } from "~types"

export function parseSubmission(data: any): LeetCodeSubmission {
  const problem = data.question
  
  return {
    problemNumber: parseInt(problem.questionFrontendId),
    title: problem.title,
    titleSlug: problem.titleSlug,
    difficulty: problem.difficulty,
    language: data.lang.name,
    code: data.code,
    runtime: data.runtimeDisplay || "N/A",
    runtimePercentile: data.runtimePercentile || 0,
    memory: data.memoryDisplay || "N/A",
    memoryPercentile: data.memoryPercentile || 0,
    tags: problem.topicTags ? problem.topicTags.map((tag: any) => tag.name) : [],
    url: `https://leetcode.com/problems/${problem.titleSlug}/`,
    submittedAt: new Date().toISOString().replace('T', ' ').split('.')[0].slice(0, 16)
  }
}

import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { Github, Folder, Key, Save, CheckCircle, XCircle, ExternalLink, Settings2, Info } from "lucide-react"
import type { ExtensionConfig } from "~types"
import "./style.css"

const storage = new Storage()

function IndexPopup() {
  const [config, setConfig] = useStorage<ExtensionConfig>("config", (v) => v || {
    githubToken: "",
    repoName: "",
    folderPath: "DSA/",
    isEnabled: true
  })

  const [token, setToken] = useState("")
  const [repo, setRepo] = useState("")
  const [path, setPath] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (config) {
      setToken(config.githubToken)
      setRepo(config.repoName)
      setPath(config.folderPath)
      setEnabled(config.isEnabled)
      if (config.githubToken) validateToken(config.githubToken, config.repoName)
    }
  }, [config])

  const validateToken = async (t: string, r: string) => {
    if (!t || !r) return
    try {
      const res = await fetch(`https://api.github.com/repos/${r}`, {
        headers: { Authorization: `Bearer ${t}` }
      })
      setIsValid(res.ok)
    } catch (e) {
      setIsValid(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    await setConfig({
      ...config,
      githubToken: token,
      repoName: repo,
      folderPath: path,
      isEnabled: enabled
    })
    await validateToken(token, repo)
    setIsSaving(false)
  }

  return (
    <div className="w-80 p-4 bg-slate-50 font-sans text-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Github className="w-6 h-6 text-indigo-600" />
          DSA Sync
        </h1>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
          {isValid ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-500" />
              Settings
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">GitHub Repo</label>
              <div className="relative">
                <Github className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="username/repo"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Folder Path</label>
              <div className="relative">
                <Folder className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. LeetCode/"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Personal Access Token</label>
              <div className="relative">
                <Key className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : (
              <>
                <Save className="w-4 h-4" />
                Save Config
              </>
            )}
          </button>
        </div>

        {config?.lastSynced && (
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <span className="text-sm font-semibold flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Last Synced
            </span>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">
                    {config.lastSynced.problemNumber}. {config.lastSynced.title}
                  </p>
                  <p className="text-[10px] text-slate-500">{config.lastSynced.submittedAt}</p>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  config.lastSynced.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                  config.lastSynced.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {config.lastSynced.difficulty}
                </span>
              </div>
              <a 
                href={`https://github.com/${config.repoName}/tree/main/${config.folderPath}`}
                target="_blank"
                className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold hover:underline"
              >
                View on GitHub
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}

        {!isValid && config?.githubToken && (
          <div className="bg-red-50 p-2.5 rounded-md border border-red-100 flex gap-2">
            <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-700 leading-tight">
              Invalid credentials. Ensure your token has <b>repo</b> scope and the repository exists.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default IndexPopup

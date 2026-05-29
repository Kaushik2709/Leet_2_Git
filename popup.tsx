import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { Github, Folder, Key, Save, CheckCircle, Flame, ExternalLink, Settings, Info, ChevronLeft, Check, X, LogIn, Link } from "lucide-react"
import type { ExtensionConfig } from "~types"
import { initiateDeviceFlow, pollForToken, parseRepoUrl, getFileContent } from "~lib/github"
import { parseReadmeForState } from "~lib/utils"
import "./style.css"

const storage = new Storage()

const DonutChart = ({ stats }: { stats: { Easy: number, Medium: number, Hard: number, Total: number } }) => {
  const size = 100
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  const total = stats.Total || 1
  const easyPct = (stats.Easy / total) * circumference
  const mediumPct = (stats.Medium / total) * circumference
  const hardPct = (stats.Hard / total) * circumference

  return (
    <div className="relative flex items-center justify-center w-[120px] h-[120px]">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="#22c55e" strokeWidth={strokeWidth} strokeDasharray={`${easyPct} ${circumference}`} strokeLinecap="round" />
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="#eab308" strokeWidth={strokeWidth} strokeDasharray={`${mediumPct} ${circumference}`} strokeDashoffset={-easyPct} strokeLinecap="round" />
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="#ef4444" strokeWidth={strokeWidth} strokeDasharray={`${hardPct} ${circumference}`} strokeDashoffset={-(easyPct + mediumPct)} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Total</span>
        <span className="text-xl font-bold text-slate-800">{stats.Total}</span>
      </div>
    </div>
  )
}

const WeekTracker = ({ history }: { history: string[] }) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const today = new Date()
  const currentDay = today.getDay()
  const mondayOffset = currentDay === 0 ? 6 : currentDay - 1
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - mondayOffset)

  return (
    <div className="flex justify-between w-full px-2 py-4">
      {days.map((day, i) => {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        const isSolved = history.includes(dateStr)
        const isToday = date.toDateString() === today.toDateString()

        return (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
              isSolved ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-slate-100 border-slate-200 text-slate-300'
            }`}>
              {isSolved ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IndexPopup() {
  const [config, setConfig] = useStorage<ExtensionConfig>("config")

  const [showSettings, setShowSettings] = useState(false)
  const [repoUrl, setRepoUrl] = useState("")
  const [path, setPath] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Device Flow State
  const [authState, setAuthState] = useStorage<{
    userCode: string;
    deviceCode: string;
    verificationUri: string;
    isPolling: boolean;
  } | null>("authState", null)

  useEffect(() => {
    if (config) {
      setRepoUrl(config.repoUrl || "")
      setPath(config.folderPath)
      setEnabled(config.isEnabled)
      if (config.accessToken && config.repoName) validateToken(config.accessToken, config.repoName)
    }
  }, [config])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (authState?.isPolling && !config?.accessToken) {
      interval = setInterval(async () => {
        try {
          const tokenData = await pollForToken(authState.deviceCode)
          if (tokenData.access_token) {
            await setConfig((prev) => ({
              ...prev,
              accessToken: tokenData.access_token,
              isEnabled: prev?.isEnabled ?? true,
              folderPath: prev?.folderPath ?? "DSA/",
              stats: prev?.stats ?? { Easy: 0, Medium: 0, Hard: 0, Total: 0 },
              streak: prev?.streak ?? 0,
              weeklyHistory: prev?.weeklyHistory ?? []
            }))
            setAuthState(null)
          } else if (tokenData.error === "access_denied" || tokenData.error === "expired_token") {
            setAuthState(null)
          }
        } catch (e) {
          console.error("Polling error", e)
        }
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [authState?.isPolling, config?.accessToken])

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

  const syncStateFromGithub = async (repoName: string, token: string, folder: string) => {
    setIsSyncing(true)
    try {
      const path = folder ? (folder.endsWith("/") ? folder : folder + "/") : ""
      const content = await getFileContent(`${path}README.md`, { repo: repoName, token })
      
      if (content) {
        const newState = parseReadmeForState(content)
        await setConfig(prev => ({
          ...prev,
          ...newState,
          accessToken: token,
          repoName: repoName,
          folderPath: folder
        }))
      }
    } catch (e) {
      console.error("Sync failed", e)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleLogin = async () => {
    try {
      const data = await initiateDeviceFlow()
      await setAuthState({
        userCode: data.user_code,
        deviceCode: data.device_code,
        verificationUri: data.verification_uri,
        isPolling: true
      })
    } catch (e: any) {
      if (e.message === "GITHUB_CLIENT_ID_MISSING") {
        alert("CRITICAL ERROR: PLASMO_PUBLIC_GITHUB_CLIENT_ID is missing in .env file. Please add it and run 'npm run build' again.")
      } else {
        alert("Login failed to initiate. Check console for details.")
      }
      console.error("Login initiation failed", e)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const repoName = parseRepoUrl(repoUrl)
    if (!repoName) {
      alert("Invalid GitHub Repository URL")
      setIsSaving(false)
      return
    }

    await setConfig({
      ...config,
      repoUrl: repoUrl,
      repoName: repoName,
      folderPath: path,
      isEnabled: enabled
    })
    
    if (config.accessToken) {
      await validateToken(config.accessToken, repoName)
      await syncStateFromGithub(repoName, config.accessToken, path)
    }
    setIsSaving(false)
    setShowSettings(false)
  }

  const isConfigured = config?.accessToken && config?.repoName
  if (showSettings || !isConfigured) {
    return (
      <div className="w-80 p-4 bg-white font-sans text-slate-800">
        <div className="flex items-center gap-2 mb-6">
          {config?.accessToken && (
            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <h1 className="text-lg font-bold">Extension Setup</h1>
        </div>

        <div className="space-y-4">
          {/* Step 1: Login */}
          {!config?.accessToken ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Step 1: Authenticate</h3>
              {authState?.isPolling ? (
                <div className="space-y-3 text-center">
                  <p className="text-sm font-medium">Enter this code on GitHub:</p>
                  <div className="text-2xl font-black tracking-widest text-indigo-600 bg-white py-2 rounded-lg border-2 border-dashed border-indigo-200">
                    {authState.userCode}
                  </div>
                  <a 
                    href={authState.verificationUri} 
                    target="_blank"
                    className="block w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
                  >
                    Open GitHub Login
                  </a>
                  <p className="text-[10px] text-slate-400 italic">Waiting for you to authorize...</p>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Github className="w-5 h-5" />
                  Login with GitHub
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Authenticated</span>
              </div>
              <button 
                onClick={() => setConfig({...config, accessToken: ""})}
                className="text-[10px] font-bold text-red-500 hover:underline uppercase"
              >
                Logout
              </button>
            </div>
          )}

          {/* Step 2: Repository */}
          <div className={`p-4 bg-slate-50 rounded-xl border border-slate-200 ${!config?.accessToken ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Step 2: Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Repo URL</label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="https://github.com/user/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Folder Path</label>
                <div className="relative">
                  <Folder className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. DSA/"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enable Sync</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {isConfigured && (
                <button
                  onClick={() => syncStateFromGithub(config.repoName, config.accessToken, path)}
                  disabled={isSyncing}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Save className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Stats from GitHub'}
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving || !repoUrl}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Finish Setup'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white font-sans text-slate-800 shadow-xl rounded-xl overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
          <div>
            <h2 className="text-xl font-extrabold leading-none tracking-tight">{config.streak || 0} day streak!</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">You're making progress!</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-400 hover:text-indigo-600">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <WeekTracker history={config.weeklyHistory || []} />

      <div className="p-4 pt-0 flex items-center justify-between gap-4">
        <DonutChart stats={config.stats} />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Easy</span>
            <span className="text-lg font-extrabold text-green-600">{config.stats.Easy}</span>
          </div>
          <div className="flex justify-between items-center border-y border-slate-50 py-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medium</span>
            <span className="text-lg font-extrabold text-yellow-600">{config.stats.Medium}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hard</span>
            <span className="text-lg font-extrabold text-red-600">{config.stats.Hard}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
          isValid ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
          {isValid ? `Synced to ${config.repoName}` : 'GitHub Disconnected'}
        </div>
      </div>

      {config.lastSynced && (
        <div className="bg-slate-50 p-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1.5">
            <span>Last Synced Problem</span>
            <a href={`https://github.com/${config.repoName}/tree/main/${config.folderPath}`} target="_blank" className="flex items-center gap-0.5 text-indigo-500 hover:underline">
              Github <ExternalLink className="w-2 h-2" />
            </a>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800 line-clamp-1 flex-1 pr-2">
              {config.lastSynced.problemNumber}. {config.lastSynced.title}
            </p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-none ${
              config.lastSynced.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
              config.lastSynced.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {config.lastSynced.difficulty}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndexPopup

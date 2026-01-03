"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cigarette, Clock, Settings } from "lucide-react"
import AuthForm from "@/components/auth-form"
import {
  loadUserData,
  saveSmokingSession,
  saveUrge,
  saveFailedUrge,
  saveUserSettings,
  resetUserData,
} from "@/app/actions" // Import server actions
import Link from "next/link"

interface User {
  id: string
  email: string
  name: string
}

interface SmokingSession {
  timestamp: number
  cigaretteNumber: number
  phase: "hourly" | "odd-even"
}

interface UrgeSession {
  timestamp: number
  motivationalMessage: string
}

interface UserSettings {
  current_phase: "hourly" | "odd-even"
  hourly_phase_start_date: number | null
}

export default function QuitSmokingApp() {
  const [user, setUser] = useState<User | null>(null)
  const [appLoading, setAppLoading] = useState(true) // Renamed to avoid conflict with auth form loading
  const [sessions, setSessions] = useState<SmokingSession[]>([])
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [phase, setPhase] = useState<"hourly" | "odd-even">("hourly")
  const [canSmoke, setCanSmoke] = useState(true)
  const [nextAllowedTime, setNextAllowedTime] = useState<number | null>(null)
  const [timeUntilNext, setTimeUntilNext] = useState<string>("")
  const [hourlyPhaseStartDate, setHourlyPhaseStartDate] = useState<number | null>(null)
  const [urges, setUrges] = useState<UrgeSession[]>([])
  const [showMotivationalMessage, setShowMotivationalMessage] = useState(false)
  const [currentMotivationalMessage, setCurrentMotivationalMessage] = useState("")
  const [showFailedUrgeToggle, setShowFailedUrgeToggle] = useState(false)
  const [failedUrges, setFailedUrges] = useState<SmokingSession[]>([])

  const motivationalMessages = [
    "You're stronger than this craving! It will pass in 3-5 minutes. 💪",
    "Every urge you resist makes you stronger. You've got this! 🌟",
    "Think about why you started this journey. Your future self will thank you! 🎯",
    "This feeling is temporary, but your health improvements are permanent! ❤️",
    "You've already come so far. Don't give up now! 🚀",
    "Breathe deeply. This craving will fade, but your determination won't! 🧘",
    "You're breaking free from addiction one urge at a time! 🔓",
    "Your body is healing right now. Keep going! 🌱",
    "Think of the money you're saving and the years you're adding to your life! 💰",
    "You're not just quitting smoking, you're choosing freedom! 🕊️",
  ]

  const getTodaySessions = useCallback(() => {
    const today = new Date(currentTime).toDateString()
    return sessions.filter((session) => new Date(session.timestamp).toDateString() === today)
  }, [sessions, currentTime])

  const getTodayCount = useCallback(() => {
    return getTodaySessions().length
  }, [getTodaySessions])

  // Check for existing user on mount
  useEffect(() => {
    const checkExistingUser = () => {
      try {
        const savedUser = localStorage.getItem("quit-smoking-user")
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error)
      } finally {
        setAppLoading(false)
      }
    }

    checkExistingUser()
  }, [])

  // Load user data from DB when user is set
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setAppLoading(true)
        try {
          const data = await loadUserData(user.id)
          if (data) {
            setSessions(data.sessions || [])
            setUrges(data.urges || [])
            setFailedUrges(data.failedUrges || [])
            setPhase(data.settings?.current_phase || "hourly")
            setHourlyPhaseStartDate(data.settings?.hourly_phase_start_date || null)
          }
        } catch (error) {
          console.error("Error fetching user data from DB:", error)
          // Optionally, show an error message to the user
        } finally {
          setAppLoading(false)
        }
      }
    }

    fetchUserData()
  }, [user]) // Depend on user object

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate next allowed smoking time
  useEffect(() => {
    if (sessions.length === 0) {
      setCanSmoke(true)
      setNextAllowedTime(null)
      return
    }

    const lastSession = sessions[sessions.length - 1]
    const lastTime = new Date(lastSession.timestamp)
    let nextTime: Date

    if (phase === "hourly") {
      nextTime = new Date(lastTime)
      nextTime.setHours(lastTime.getHours() + 1, 0, 0, 0)
    } else {
      nextTime = new Date(lastTime)
      nextTime.setHours(lastTime.getHours() + 2, 0, 0, 0)
    }

    setNextAllowedTime(nextTime.getTime())
    setCanSmoke(currentTime >= nextTime.getTime())
  }, [sessions, currentTime, phase])

  // Update countdown timer
  useEffect(() => {
    if (nextAllowedTime && !canSmoke) {
      const diff = nextAllowedTime - currentTime
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeUntilNext(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        )
      } else {
        setTimeUntilNext("00:00:00") // Ensure it shows 00:00:00 when time is up
      }
    } else {
      setTimeUntilNext("") // Clear countdown if can smoke or no next time
    }
  }, [currentTime, nextAllowedTime, canSmoke])

  const handleAuthSuccess = (userData: User) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem("quit-smoking-user")
    setUser(null)
    // Reset all app state
    setSessions([])
    setUrges([])
    setFailedUrges([])
    setPhase("hourly")
    setHourlyPhaseStartDate(null)
    setShowFailedUrgeToggle(false)
  }

  const logCigarette = useCallback(async () => {
    if (!canSmoke || !user) return

    const todayCount = getTodayCount()

    const newSession: SmokingSession = {
      timestamp: currentTime,
      cigaretteNumber: todayCount + 1,
      phase: phase,
    }

    const updatedSessions = [...sessions, newSession]
    setSessions(updatedSessions)

    // Set start date if first cigarette
    if (sessions.length === 0) {
      setHourlyPhaseStartDate(currentTime)
      await saveUserSettings(user.id, { hourly_phase_start_date: currentTime })
    }

    await saveSmokingSession(user.id, newSession)
  }, [canSmoke, user, currentTime, sessions, phase, getTodayCount])

  const markLastCigaretteOfDay = useCallback(async () => {
    if (!user) return

    const confirmed = window.confirm(
      "Marking this as your last cigarette of the day. The counter will reset tomorrow. Are you sure?",
    )
    if (!confirmed) return

    // Show a congratulatory message
    const endOfDayMessages = [
      "Great job today! Your body is already starting to heal. 🌙",
      "You made it through another day! Tomorrow is a fresh start. ⭐",
      "Well done! Each day of control is a victory. Sleep well! 💤",
      "Congratulations on another day of progress! Rest up. 🎯",
      "You did it! Your commitment is inspiring. See you tomorrow! 🌟",
    ]

    const randomMessage = endOfDayMessages[Math.floor(Math.random() * endOfDayMessages.length)]
    setCurrentMotivationalMessage(randomMessage)
    setShowMotivationalMessage(true)

    setTimeout(() => {
      setShowMotivationalMessage(false)
    }, 5000)
  }, [user])

  const logUrge = useCallback(async () => {
    if (!user) return

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

    const newUrge: UrgeSession = {
      timestamp: currentTime,
      motivationalMessage: randomMessage,
    }

    const updatedUrges = [...urges, newUrge]
    setUrges(updatedUrges)

    await saveUrge(user.id, newUrge)

    setCurrentMotivationalMessage(randomMessage)
    setShowMotivationalMessage(true)

    setTimeout(() => {
      setShowMotivationalMessage(false)
    }, 5000)
  }, [user, currentTime, urges])

  const logFailedUrge = useCallback(async () => {
    if (!user) return

    const todayCount = getTodayCount()

    const newFailedUrge: SmokingSession = {
      timestamp: currentTime,
      cigaretteNumber:
        todayCount +
        failedUrges.filter((urge) => new Date(urge.timestamp).toDateString() === new Date(currentTime).toDateString())
          .length +
        1,
      phase: phase,
    }

    const updatedFailedUrges = [...failedUrges, newFailedUrge]
    setFailedUrges(updatedFailedUrges)
    setShowFailedUrgeToggle(false)

    await saveFailedUrge(user.id, newFailedUrge)

    const recoveryMessages = [
      "It's okay - recovery isn't linear. Get back on track now! 💪",
      "One slip doesn't erase your progress. You're still on your journey! 🌟",
      "Tomorrow is a fresh start. Learn from this and keep going! 🌅",
      "You're human. What matters is getting back to your plan right now! ❤️",
      "This doesn't define you. Your commitment to quit does! 🎯",
    ]

    const randomRecoveryMessage = recoveryMessages[Math.floor(Math.random() * recoveryMessages.length)]
    setCurrentMotivationalMessage(randomRecoveryMessage)
    setShowMotivationalMessage(true)

    setTimeout(() => {
      setShowMotivationalMessage(false)
    }, 5000)
  }, [user, currentTime, sessions, failedUrges, phase])

  const advanceToOddsEvens = useCallback(async () => {
    if (!user) return
    setPhase("odd-even")
    await saveUserSettings(user.id, { current_phase: "odd-even" })
  }, [user])

  const getDaysInHourlyPhase = () => {
    if (!hourlyPhaseStartDate) return 0
    return Math.floor((currentTime - hourlyPhaseStartDate) / (1000 * 60 * 60 * 24))
  }

  const handleResetApp = useCallback(async () => {
    if (!user) return
    const confirmed = window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")
    if (!confirmed) return

    await resetUserData(user.id)
    setSessions([])
    setPhase("hourly")
    setHourlyPhaseStartDate(null)
    setUrges([])
    setFailedUrges([])
    setShowFailedUrgeToggle(false)
  }, [user])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCurrentPhaseDescription = () => {
    if (phase === "hourly") {
      return "Hourly Phase: One cigarette per hour allowed"
    } else {
      return "Advanced Phase: Cigarettes allowed every 2 hours"
    }
  }

  // Show loading screen
  if (appLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading your progress...</p>
        </div>
      </div>
    )
  }

  // Show auth form if no user
  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  const todayCount = getTodayCount()
  const todayUrges = urges.filter(
    (urge) => new Date(urge.timestamp).toDateString() === new Date(currentTime).toDateString(),
  )
  const todayFailedUrges = failedUrges.filter(
    (urge) => new Date(urge.timestamp).toDateString() === new Date(currentTime).toDateString(),
  )

  // Show main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Quit Smoking Journey</h1>
            <p className="text-gray-600">One hour at a time</p>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Main Action Card */}
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-4xl font-bold">{todayCount}/20</div>
            <div className="text-sm text-muted-foreground">Cigarettes logged today</div>

            {canSmoke ? (
              <div className="space-y-3">
                <Button onClick={logCigarette} size="lg" className="w-full bg-red-500 hover:bg-red-600">
                  <Cigarette className="mr-2 h-5 w-5" />
                  Log Cigarette
                </Button>
                <Button onClick={logUrge} variant="outline" size="lg" className="w-full bg-transparent">
                  💭 Log Urge
                </Button>
                {todayCount > 0 && (
                  <Button
                    onClick={markLastCigaretteOfDay}
                    variant="outline"
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:bg-blue-100"
                  >
                    🌙 Mark Last Cigarette of Day
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Button disabled size="lg" className="w-full">
                  <Clock className="mr-2 h-5 w-5" />
                  Wait for Next Window
                </Button>
                <div className="text-2xl font-mono font-bold text-red-500">{timeUntilNext}</div>
                <div className="text-sm text-muted-foreground">
                  Next cigarette allowed at {nextAllowedTime ? formatTime(nextAllowedTime) : ""}
                </div>
                <Button onClick={logUrge} variant="outline" size="lg" className="w-full bg-transparent">
                  💭 Log Urge
                </Button>

                {/* Failed Urge Toggle Section */}
                <div className="pt-2 border-t border-gray-200">
                  {!showFailedUrgeToggle ? (
                    <Button
                      onClick={() => setShowFailedUrgeToggle(true)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-gray-500 hover:text-gray-700"
                    >
                      I smoked outside my window...
                    </Button>
                  ) : (
                    <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-sm text-orange-800 font-medium">
                        It happens. Logging this helps you learn and recover.
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={logFailedUrge} size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600">
                          Log Failed Urge
                        </Button>
                        <Button
                          onClick={() => setShowFailedUrgeToggle(false)}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Motivational Message Popup */}
            {showMotivationalMessage && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center space-y-4 animate-in fade-in duration-300">
                  <div className="text-4xl">🌟</div>
                  <div className="text-lg font-semibold text-green-700">{currentMotivationalMessage}</div>
                  <Button
                    onClick={() => setShowMotivationalMessage(false)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Thank You!
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress & Phase Management Card */}
        {sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress & Phase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total cigarettes logged:</span>
                <Badge variant="outline">{sessions.length}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span>Days in hourly phase:</span>
                <Badge variant="outline">{getDaysInHourlyPhase()} days</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span>Urges resisted today:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {todayUrges.length}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span>Failed urges today:</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  {todayFailedUrges.length}
                </Badge>
              </div>

              {phase === "hourly" && getDaysInHourlyPhase() >= 30 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-2">
                    🎉 Congratulations! You've completed 30 days in hourly phase.
                  </div>
                  <Button onClick={advanceToOddsEvens} size="sm" className="w-full bg-green-600 hover:bg-green-700">
                    Advance to Odds & Evens Phase
                  </Button>
                </div>
              )}

              {phase === "hourly" && getDaysInHourlyPhase() < 30 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800 mb-2">Ready to challenge yourself more?</div>
                  <Button onClick={advanceToOddsEvens} variant="outline" size="sm" className="w-full bg-transparent">
                    Advance to Odds & Evens Phase
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Recent Sessions:</div>
                {sessions
                  .slice(-5)
                  .reverse()
                  .map((session, index) => (
                    <div key={session.timestamp} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Cigarette #{session.cigaretteNumber}</span>
                      <span className="text-sm text-muted-foreground">{formatTime(session.timestamp)}</span>
                    </div>
                  ))}
                {sessions.length > 5 && (
                  <div className="text-center text-sm text-muted-foreground">... and {sessions.length - 5} more</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

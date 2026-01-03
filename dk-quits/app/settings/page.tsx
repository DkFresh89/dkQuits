"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, Info } from "lucide-react"
import Link from "next/link"
import { resetUserData } from "../actions"
import { useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
}

export default function SettingsPage() {
  const [isResetting, setIsResetting] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("quit-smoking-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleResetApp = async () => {
    if (!user) {
      alert("No user found. Please log in first.")
      return
    }

    if (window.confirm("Are you sure you want to reset all progress? This cannot be undone!")) {
      setIsResetting(true)
      try {
        const result = await resetUserData(user.id)
        if (result.success) {
          alert("Progress reset successfully!")
          window.location.href = "/"
        } else {
          alert(result.error || "Failed to reset progress. Please try again.")
        }
      } catch (error) {
        console.error("Failed to reset:", error)
        alert("Failed to reset progress. Please try again.")
      } finally {
        setIsResetting(false)
      }
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-600">Manage your journey</p>
          </div>
        </div>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              How it Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• Log each cigarette by pressing the button</p>
            <p>• Wait for the next hourly window to smoke again</p>
            <p>• Mark your last cigarette of the day to end tracking for today</p>
            <p>• Your daily count resets at midnight automatically</p>
            <p>• After 30 days OR when you feel ready, advance to odds & evens</p>
            <p>• Odds & evens phase: Skip every other hour (2-hour intervals)</p>
            <p>• Goal: Gradually reduce smoking frequency at your own pace</p>
            <p>• Your data is securely saved in the cloud!</p>
          </CardContent>
        </Card>

        {/* Reset Progress */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <RotateCcw className="h-5 w-5" />
              Reset Progress
            </CardTitle>
            <CardDescription>
              This will permanently delete all your data and start fresh. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleResetApp} variant="destructive" className="w-full" disabled={isResetting}>
              {isResetting ? "Resetting..." : "Reset All Progress"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

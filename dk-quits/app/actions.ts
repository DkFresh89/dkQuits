"use server"

import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

// Helper to convert MySQL's WEEKDAY (0=Mon, 6=Sun) to JS Date.getDay() (0=Sun, 6=Sat)
const mysqlWeekdayToJsDay = (mysqlDay: number) => (mysqlDay + 1) % 7

// Helper to convert JS Date.getDay() (0=Sun, 6=Sat) to MySQL's WEEKDAY (0=Mon, 6=Sun)
const jsDayToMysqlWeekday = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1)

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
  cigarettes_per_pack?: number
  target_quit_date?: string
  notifications_enabled?: boolean
  daily_reminder_time?: string
}

export async function signupUser(
  name: string,
  email: string,
  password: string,
): Promise<{ user?: User; error?: string }> {
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = crypto.randomUUID() // Generate UUID for MySQL VARCHAR(36)

    const result: any = await query(
      "INSERT INTO users (id, name, email, password_hash, email_verified) VALUES (?, ?, ?, ?, ?)",
      [userId, name, email, hashedPassword, false],
    )

    if (result.affectedRows === 1) {
      // Also create default settings for the new user
      await query("INSERT INTO user_settings (user_id, current_phase) VALUES (?, ?)", [userId, "hourly"])

      return { user: { id: userId, name, email } }
    } else {
      return { error: "Failed to create user." }
    }
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return { error: "Email already registered." }
    }
    console.error("Signup error:", error)
    return { error: "An unexpected error occurred during signup." }
  }
}

export async function loginUser(email: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    const users: any = await query("SELECT id, name, email, password_hash FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      return { error: "Invalid credentials." }
    }

    const user = users[0]
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (passwordMatch) {
      // Update last_login timestamp
      await query("UPDATE users SET last_login = CURRENT_TIMESTAMP() WHERE id = ?", [user.id])
      return { user: { id: user.id, name: user.name, email: user.email } }
    } else {
      return { error: "Invalid credentials." }
    }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred during login." }
  }
}

export async function loadUserData(userId: string): Promise<{
  sessions: SmokingSession[]
  urges: UrgeSession[]
  failedUrges: SmokingSession[]
  settings: UserSettings
  error?: string
}> {
  try {
    const [sessionsRows, urgesRows, failedUrgesRows, settingsRows]: [any, any, any, any] = await Promise.all([
      query(
        "SELECT timestamp, cigarette_number, phase FROM smoking_sessions WHERE user_id = ? ORDER BY timestamp ASC",
        [userId],
      ),
      query("SELECT timestamp, motivational_message FROM urges WHERE user_id = ? ORDER BY timestamp ASC", [userId]),
      query("SELECT timestamp, cigarette_number, phase FROM failed_urges WHERE user_id = ? ORDER BY timestamp ASC", [
        userId,
      ]),
      query("SELECT current_phase, hourly_phase_start_date FROM user_settings WHERE user_id = ?", [userId]),
    ])

    const sessions = sessionsRows.map((row: any) => ({
      timestamp: new Date(row.timestamp).getTime(),
      cigaretteNumber: row.cigarette_number,
      phase: row.phase,
    }))

    const urges = urgesRows.map((row: any) => ({
      timestamp: new Date(row.timestamp).getTime(),
      motivationalMessage: row.motivational_message,
    }))

    const failedUrges = failedUrgesRows.map((row: any) => ({
      timestamp: new Date(row.timestamp).getTime(),
      cigaretteNumber: row.cigarette_number,
      phase: row.phase,
    }))

    const settings: UserSettings = settingsRows[0]
      ? {
          current_phase: settingsRows[0].current_phase,
          hourly_phase_start_date: settingsRows[0].hourly_phase_start_date
            ? new Date(settingsRows[0].hourly_phase_start_date).getTime()
            : null,
        }
      : { current_phase: "hourly", hourly_phase_start_date: null } // Default if no settings found

    return { sessions, urges, failedUrges, settings }
  } catch (error) {
    console.error("Error loading user data:", error)
    return {
      sessions: [],
      urges: [],
      failedUrges: [],
      settings: { current_phase: "hourly", hourly_phase_start_date: null },
      error: "Failed to load user data.",
    }
  }
}

export async function saveSmokingSession(
  userId: string,
  session: SmokingSession,
): Promise<{ success: boolean; error?: string }> {
  try {
    const timestamp = new Date(session.timestamp)
    await query(
      "INSERT INTO smoking_sessions (user_id, timestamp, cigarette_number, phase, session_date, hour_of_day, day_of_week) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        timestamp,
        session.cigaretteNumber,
        session.phase,
        timestamp.toISOString().split("T")[0], // YYYY-MM-DD
        timestamp.getHours(),
        jsDayToMysqlWeekday(timestamp.getDay()),
      ],
    )
    return { success: true }
  } catch (error) {
    console.error("Error saving smoking session:", error)
    return { success: false, error: "Failed to save smoking session." }
  }
}

export async function saveUrge(userId: string, urge: UrgeSession): Promise<{ success: boolean; error?: string }> {
  try {
    const timestamp = new Date(urge.timestamp)
    await query(
      "INSERT INTO urges (user_id, timestamp, motivational_message, urge_date, hour_of_day, day_of_week) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        timestamp,
        urge.motivationalMessage,
        timestamp.toISOString().split("T")[0], // YYYY-MM-DD
        timestamp.getHours(),
        jsDayToMysqlWeekday(timestamp.getDay()),
      ],
    )
    return { success: true }
  } catch (error) {
    console.error("Error saving urge:", error)
    return { success: false, error: "Failed to save urge." }
  }
}

export async function saveFailedUrge(
  userId: string,
  failedUrge: SmokingSession,
): Promise<{ success: boolean; error?: string }> {
  try {
    const timestamp = new Date(failedUrge.timestamp)
    await query(
      "INSERT INTO failed_urges (user_id, timestamp, cigarette_number, phase, session_date, hour_of_day, day_of_week) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        timestamp,
        failedUrge.cigaretteNumber,
        failedUrge.phase,
        timestamp.toISOString().split("T")[0], // YYYY-MM-DD
        timestamp.getHours(),
        jsDayToMysqlWeekday(timestamp.getDay()),
      ],
    )
    return { success: true }
  } catch (error) {
    console.error("Error saving failed urge:", error)
    return { success: false, error: "Failed to save failed urge." }
  }
}

export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateFields = []
    const updateValues = []

    if (settings.current_phase !== undefined) {
      updateFields.push("current_phase = ?")
      updateValues.push(settings.current_phase)
    }
    if (settings.hourly_phase_start_date !== undefined) {
      updateFields.push("hourly_phase_start_date = ?")
      updateValues.push(settings.hourly_phase_start_date ? new Date(settings.hourly_phase_start_date) : null)
    }
    // Add other settings fields as needed

    if (updateFields.length === 0) {
      return { success: true } // Nothing to update
    }

    const sql = `UPDATE user_settings SET ${updateFields.join(", ")} WHERE user_id = ?`
    updateValues.push(userId)

    await query(sql, updateValues)
    return { success: true }
  } catch (error) {
    console.error("Error saving user settings:", error)
    return { success: false, error: "Failed to save user settings." }
  }
}

export async function resetUserData(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await Promise.all([
      query("DELETE FROM smoking_sessions WHERE user_id = ?", [userId]),
      query("DELETE FROM urges WHERE user_id = ?", [userId]),
      query("DELETE FROM failed_urges WHERE user_id = ?", [userId]),
      query("UPDATE user_settings SET current_phase = ?, hourly_phase_start_date = NULL WHERE user_id = ?", [
        "hourly",
        userId,
      ]),
    ])
    return { success: true }
  } catch (error) {
    console.error("Error resetting user data:", error)
    return { success: false, error: "Failed to reset user data." }
  }
}

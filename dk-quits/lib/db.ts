import mysql from "mysql2/promise"

const requiredEnvVars = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const port = Number.parseInt(process.env.MYSQL_PORT || "3306", 10)
if (Number.isNaN(port)) {
  throw new Error("MYSQL_PORT must be a valid number")
}

// Database connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST!,
  user: process.env.MYSQL_USER!,
  password: process.env.MYSQL_PASSWORD!,
  database: process.env.MYSQL_DATABASE!,
  port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function query(sql: string, values?: any[]) {
  try {
    const [rows] = await pool.execute(sql, values)
    return rows
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export default pool

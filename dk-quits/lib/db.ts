import mysql from "mysql2/promise"

// Database connection pool
const pool = mysql.createPool({
  host: '942u-s.h.filess.io',//process.env.MYSQL_HOST,
  user: 'quitSmoking_beganhello',//process.env.MYSQL_USER,
  password: 'ab688aae3cab2a570f6ee926a6573e3d5956f948',//process.env.MYSQL_PASSWORD,
  database: 'quitSmoking_beganhello',//process.env.MYSQL_DATABASE,
  port: '3307',//Number.parseInt(process.env.MYSQL_PORT || "3307", 10),
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

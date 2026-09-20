module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""

  res.status(200).send(`window.IR_CONFIG = ${JSON.stringify({
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: key,
    ADMIN_USERNAME: "Rubansu1",
  })}`)
}

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""

  res.status(200).send(`(() => {
    const current = window.IR_CONFIG || {}
    window.IR_CONFIG = {
      SUPABASE_URL: current.SUPABASE_URL || ${JSON.stringify(url)},
      SUPABASE_ANON_KEY: current.SUPABASE_ANON_KEY || ${JSON.stringify(key)},
      ADMIN_USERNAME: current.ADMIN_USERNAME || "Rubansu1"
    }
  })()`)
}

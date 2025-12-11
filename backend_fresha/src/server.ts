import app from './app'

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})
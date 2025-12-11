import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import serviceRoutes from './routes/crudService.routes'
import staffRoutes from './routes/staff.routes'
import salonRoutes from './routes/salon.routes'
import bookingRoutes from './routes/booking.routes'
import clientRoutes from './routes/client.routes'

dotenv.config()

const app = express()

// Middlewares globaux
app.use(cors({
  origin: 'http://localhost:5173', // URL du frontend
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/salons', salonRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/clients', clientRoutes)

// Route de test
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' })
})

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  })
})

// Gestion des erreurs globales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur serveur:', err)
  res.status(500).json({
    success: false,
    error: 'Erreur serveur interne'
  })
})

export default app
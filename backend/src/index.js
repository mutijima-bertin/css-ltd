import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

BigInt.prototype.toJSON = function () {
  return Number(this);
};

import contactRoutes from './routes/contact.js';
import portfolioRoutes from './routes/portfolio.js';
import servicesRoutes from './routes/services.js';
import bookingRoutes from './routes/bookings.js';
import talentRoutes from './routes/talent.js';
import galleryRoutes from './routes/gallery.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());

const corsOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : ['http://localhost:3000'];
app.use(cors({ origin: corsOrigins }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Creative Sound Studio API is running' });
});

app.use('/api/contact', contactRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/talent', talentRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

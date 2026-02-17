import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.AUTH_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});

export default app;

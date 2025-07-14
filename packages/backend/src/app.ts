import express from 'express';
import cors from 'cors';
import gridRoutes from './routes/gridRoutes';   
import simulationSetupRoutes from './routes/simulationSetupRoutes';
import authRoutes from './routes/authRoutes'; // Import auth routes
import setupsRoutes from './routes/setupsRoutes'; // Import setups routes

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://robot-simulation-frontend.onrender.com' 
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());

//   mounting happens here
app.use('/api/auth', authRoutes); // Mount auth routes
app.use('/api/grids', gridRoutes);
app.use('/api/simulation', simulationSetupRoutes);
app.use('/api/setups', setupsRoutes); // Mount setups routes

export default app;
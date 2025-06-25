import express from 'express';
import cors from 'cors';
import gridRoutes from './routes/gridRoutes';   
import simulationSetupRoutes from './routes/simulationSetupRoutes';
import authRoutes from './routes/authRoutes'; // Import auth routes

const app = express();

app.use(cors());
app.use(express.json());

//   mounting happens here
app.use('/api/auth', authRoutes); // Mount auth routes
app.use('/api/grids', gridRoutes);
app.use('/api/simulation',simulationSetupRoutes);

export default app;
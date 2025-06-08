import express from 'express';
import cors from 'cors';
import gridRoutes from './routes/gridRoutes';   
import simulationSetupRoutes from './routes/simulationSetupRoutes';
const app = express();

app.use(cors());
app.use(express.json());

//   mounting happens here
app.use('/api/grids', gridRoutes);
app.use('/api/simulation',simulationSetupRoutes);

export default app;


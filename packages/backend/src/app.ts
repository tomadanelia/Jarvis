import express from 'express';
import cors from 'cors';
import gridRoutes from './routes/gridRoutes';   

const app = express();

app.use(cors());
app.use(express.json());

//   mounting happens here
app.use('/api/grids', gridRoutes);

export default app;


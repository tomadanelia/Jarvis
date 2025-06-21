import dotenv from 'dotenv';
import path from 'path';
import app from './app';
import http from 'http'; 
import { Server } from 'socket.io';
import { webSocketManager } from './services/webSocketManager';
import { simulationStateService } from './services/simulationStateService'; //  Adding new  line

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const port = process.env.PORT || 3001; 
const server = http.createServer(app);

const io = new Server(server, {
  path: '/ws',
  cors: {
    origin: '*', //  can restrict in prod
    methods: ['GET', 'POST'],
  },
});

//  Inject simulationStateService before starting
webSocketManager.setSimulationStateService(simulationStateService);
webSocketManager.init(io); // Now simState is safely available

export { io, server };

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Press CTRL+C to stop');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

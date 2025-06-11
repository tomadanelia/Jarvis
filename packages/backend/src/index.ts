
import dotenv from 'dotenv';
import path from 'path';
import app from './app';
import http from 'http'; 

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const port = process.env.PORT || 3001; 
const server = http.createServer(app);

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
  
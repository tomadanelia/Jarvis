import { io, Socket } from 'socket.io-client';
import { useSimulationStore } from '../store/simulationStore'; 
import type { Robot, Task, Cell, SimulationStatus as BackendSimulationStatus } from '../../../common/src/types'; 

interface InitialStatePayload {
  currentGrid: Cell[][] | null;
  gridId: string | null;
  gridName: string | null;
  robots: Robot[];
  tasks: Task[];
  selectedStrategy: string | null; 
  simulationStatus: BackendSimulationStatus;
  simulationTime: number;
  controllerClientId: string | null; 
}

interface SimulationUpdatePayload {
  robots: Robot[];
  tasks: Task[];
  simulationTime: number;
  controllerClientId: string | null; 
}

interface SimulationEndedPayload {
  simulationTime: number;
  finalMetrics?: any;
  controllerClientId: string | null; 
}

interface ErrorMessagePayload {
  message: string;
}

const VITE_SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

let socket: Socket;

export const connectWebSocket = () => {
  if (socket && socket.connected) {
    console.log('WS: Already connected.');
    return;
  }

  console.log(`WS: Attempting to connect to ${VITE_SOCKET_URL}`);
  socket = io(VITE_SOCKET_URL, {
      path: '/ws',
    // Optional: add connection options here if needed
    // e.g., transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('WS: Successfully connected to server with ID:', socket.id);
    
    if (socket.id) {
    useSimulationStore.getState().setMyClientId(socket.id);
    }
    else {
        console.warn('WS: No socket ID available after connection.');
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn('WS: Disconnected from server. Reason:', reason);
    useSimulationStore.getState().setMyClientId(null); 
  });

  socket.on('connect_error', (error) => {
    console.error('WS: Connection error:', error);
    useSimulationStore.getState().addError(`WebSocket Connection Error: ${error.message}`);
  });

  socket.on('initial_state', (data: InitialStatePayload) => {
    console.log('WS: Received initial_state:', data);
    
    useSimulationStore.getState().handleInitialState(data);
  });

  socket.on('simulation_update', (data: SimulationUpdatePayload) => {
    console.log('WS: Received simulation_update:', data);
    useSimulationStore.getState().handleSimulationUpdate(data);
  });

  socket.on('simulation_ended', (data: SimulationEndedPayload) => {
    console.log('WS: Received simulation_ended:', data);
    useSimulationStore.getState().handleSimulationEnded(data);
  });

  socket.on('error_message', (data: ErrorMessagePayload) => {
    console.error('WS: Received error_message:', data.message);
    useSimulationStore.getState().addError(`Server Error: ${data.message}`);
  });
};

export const disconnectWebSocket = () => {
  if (socket) {
    console.log('WS: Manually disconnecting...');
    socket.disconnect();
  }
};

export const getSocket = () => socket;
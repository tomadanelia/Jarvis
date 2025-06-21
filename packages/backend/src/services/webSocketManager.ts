import { Server, Socket } from 'socket.io';
import { SimulationStateService } from './simulationStateService';

/**
 * Centralised wrapper around Socket.IO.
 * Responsible for pushing simulation data to every connected client.
 */
export class WebSocketManager {
  /** The Socket.IO server instance (initialized in `init`). */
  private io?: Server;

  /** Simulation state service used to retrieve current state snapshots. */
  private readonly simState: SimulationStateService;

  /**
   * Constructs a new WebSocketManager.
   * @param simState - An instance of the SimulationStateService.
   */
  constructor(simState: SimulationStateService) {
    this.simState = simState;
  }

  /**
   * Initializes the WebSocket server and sets up the connection listener.
   * Must be called once after creating the HTTP server.
   *
   * @param io - The Socket.IO server instance created from the HTTP server.
   */
  public init(io: Server): void {
    this.io = io;

    io.on('connection', (socket: Socket) => {
      console.log('WS — client connected:', socket.id);
      socket.emit('initial_state', this.buildFullState());
    });
  }

  /* ------------ broadcast helpers ------------ */

  /**
   * Broadcasts the full current simulation state to all connected clients.
   * Typically used after setup or grid changes.
   */
  public broadcastInitialStateToAll(): void {
    this.io?.emit('initial_state', this.buildFullState());
  }

  /**
   * Broadcasts the current simulation state at the end of each simulation tick.
   */
  public broadcastSimulationUpdate(): void {
    this.io?.emit('simulation_update', this.buildFullState());
  }

  /**
   * Broadcasts a message indicating the simulation has ended.
   */
  public broadcastSimulationEnded(): void {
    this.io?.emit('simulation_ended', {
      simulationTime: this.simState.getSimulationTime(),
    });
  }

  /**
   * Broadcasts an error message to all connected clients.
   * @param message - A description of the error that occurred.
   */
  public broadcastError(message: string): void {
    this.io?.emit('error_message', { message });
  }

  /* ------------ private helpers ------------- */

  /**
   * Builds a complete snapshot of the current simulation state.
   * @returns An object representing the full simulation state.
   */
  private buildFullState() {
    return {
      currentGrid:       this.simState.getCurrentGrid(),
      gridId:            this.simState.getCurrentGridId(),
      gridName:          this.simState.getCurrentGridName(),
      robots:            this.simState.getRobots(),
      tasks:             this.simState.getTasks(),
      selectedStrategy:  this.simState.getSelectedStrategy(),
      simulationStatus:  this.simState.getSimulationStatus(),
      simulationTime:    this.simState.getSimulationTime(),
    };
  }
}

/**
 * Singleton export of the WebSocketManager.
 * Used by the rest of the backend to emit events and initialize the WS server.
 */
import { simulationStateService } from './simulationStateService';
export const webSocketManager = new WebSocketManager(simulationStateService);

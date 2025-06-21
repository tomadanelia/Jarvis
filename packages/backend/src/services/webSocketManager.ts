import { Server, Socket } from 'socket.io';
import { SimulationStateService } from './simulationStateService';

/**
 * Centralized wrapper around Socket.IO.
 * Responsible for pushing simulation data to every connected client.
 */
export class WebSocketManager {
  /** The Socket.IO server instance (initialized in `init`). */
  private io?: Server;

  /** Simulation state service used to retrieve current state snapshots. */
  private simState?: SimulationStateService;

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
      if (this.simState) {
        socket.emit('initial_state', this.buildFullState());
      } else {
        console.warn('WebSocketManager: simState not set yet, cannot send initial_state');
      }
    });
  }

  /**
   * Injects the SimulationStateService after both modules are initialized,
   * avoiding circular dependency issues.
   */
  public setSimulationStateService(service: SimulationStateService): void {
    this.simState = service;
  }

  /* ------------ broadcast helpers ------------ */

  public broadcastInitialStateToAll(): void {
    if (!this.simState) return;
    this.io?.emit('initial_state', this.buildFullState());
  }

  public broadcastSimulationUpdate(): void {
    if (!this.simState) return;
    this.io?.emit('simulation_update', this.buildFullState());
  }

  public broadcastSimulationEnded(): void {
    if (!this.simState) return;
    this.io?.emit('simulation_ended', {
      simulationTime: this.simState.getSimulationTime(),
    });
  }

  public broadcastError(message: string): void {
    this.io?.emit('error_message', { message });
  }

  /* ------------ private helpers ------------- */

  private buildFullState() {
    if (!this.simState) {
      console.warn("WebSocketManager: simState is not set, can't build state");
      return {};
    }

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

// Singleton export (without simState injected yet)
export const webSocketManager = new WebSocketManager();

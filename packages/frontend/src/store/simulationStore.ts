// packages/frontend/src/store/simulationStore.ts
import { create } from 'zustand';
import type { Cell, Robot, Task, SimulationStatus as BackendSimulationStatus } from '../../../common/src/types';

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
  controllerClientId: string | null;
}

/** Mode used to determine what is being placed: robot or task. */
type PlacementMode = 'robot' | 'task' | null;

/** Current simulation execution status. */
// type SimulationStatus = 'idle' | 'running' | 'paused'; // Already defined, matches BackendSimulationStatus

/**
 * Zustand store state and actions for managing simulation UI and logic.
 */
interface SimulationState {
  /** List of grids fetched from backend. */
  availableGrids: { id: string; name: string }[];
  selectedGridId: string | null;
  selectedGridLayout: Cell[][] | null;
  robots: Robot[];
  tasks: Task[];
  selectedStrategy: string | null;
  simulationStatus: BackendSimulationStatus; // Use the common type
  simulationTime: number; // Add simulation time
  errorMessages: string[];
  currentPlacementMode: PlacementMode;
  myClientId: string | null; // For the client's own socket ID
  controllerClientId: string | null; // For the current simulation controller's ID

  setAvailableGrids: (grids: { id: string; name: string }[]) => void;
  setSelectedGrid: (id: string, layout: Cell[][]) => void;
  setRobots: (robots: Robot[]) => void;
  setTasks: (tasks: Task[]) => void;
  addRobot: (robot: Robot) => void;
  addTask: (task: Task) => void;
  setStrategy: (strategy: string) => void;
  setSimulationStatus: (status: BackendSimulationStatus) => void;
  addError: (msg: string) => void;
  clearErrors: () => void;
  setPlacementMode: (mode: PlacementMode) => void;
  setMyClientId: (id: string | null) => void; // Action to set client's ID
  handleInitialState: (payload: InitialStatePayload) => void;
  handleSimulationUpdate: (payload: SimulationUpdatePayload) => void;
  handleSimulationEnded: (payload: SimulationEndedPayload) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  availableGrids: [],
  selectedGridId: null,
  selectedGridLayout: null,
  robots: [],
  tasks: [],
  selectedStrategy: null,
  simulationStatus: 'idle',
  simulationTime: 0, // Initialize simulation time
  errorMessages: [],
  currentPlacementMode: null,
  myClientId: null,
  controllerClientId: null,

  setAvailableGrids: (grids) => set({ availableGrids: grids }),
  setSelectedGrid: (id, layout) =>
    set({ selectedGridId: id, selectedGridLayout: layout, robots: [], tasks: [], simulationTime: 0, simulationStatus: 'idle' }), // Reset items when grid changes
  setRobots: (robots) => set({ robots }),
  setTasks: (tasks) => set({ tasks }),
  addRobot: (robot) => // This might be superseded by full state updates via WS
    set((state) => ({ robots: [...state.robots, robot] })),
  addTask: (task) => // This might be superseded by full state updates via WS
    set((state) => ({ tasks: [...state.tasks, task] })),
  setStrategy: (strategy) => set({ selectedStrategy: strategy }),
  setSimulationStatus: (status) => set({ simulationStatus: status }),
  addError: (msg) =>
    set((state) => ({ errorMessages: [...state.errorMessages, msg] })),
  clearErrors: () => set({ errorMessages: [] }),
  setPlacementMode: (mode) => set({ currentPlacementMode: mode }),
  setMyClientId: (id) => set({ myClientId: id }),

  // Implement WebSocket payload handlers
  handleInitialState: (payload) => set({
    selectedGridLayout: payload.currentGrid,
    selectedGridId: payload.gridId,
    // availableGrids: ? - initial_state might not send all available, only the current one.
    // gridName might be useful to store if you display it.
    robots: payload.robots,
    tasks: payload.tasks,
    selectedStrategy: payload.selectedStrategy,
    simulationStatus: payload.simulationStatus,
    simulationTime: payload.simulationTime,
    controllerClientId: payload.controllerClientId,
  }),
  handleSimulationUpdate: (payload) => set({
    robots: payload.robots,
    tasks: payload.tasks,
    simulationTime: payload.simulationTime,
    controllerClientId: payload.controllerClientId,
    simulationStatus: 'running', // Implicitly, if we get an update, it's running or paused but driven by the update
  }),
  handleSimulationEnded: (payload) => set({
    simulationStatus: 'idle', // Or perhaps 'ended' if you add that status
    simulationTime: payload.simulationTime,
    // Potentially clear robots/tasks or leave them in their final state
    controllerClientId: payload.controllerClientId,
  }),
}));
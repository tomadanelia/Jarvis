import { create } from 'zustand';
import type { Cell, Robot, Task } from '../../../common/src/types';

/** Mode used to determine what is being placed: robot or task. */
type PlacementMode = 'robot' | 'task' | null;

/** Current simulation execution status. */
type SimulationStatus = 'idle' | 'running' | 'paused';

/**
 * Zustand store state and actions for managing simulation UI and logic.
 */
interface SimulationState {
  /** List of grids fetched from backend. */
  availableGrids: { id: string; name: string }[];

  /** Currently selected grid's ID. */
  selectedGridId: string | null;

  /** Layout of the selected grid as a 2D array of cells. */
  selectedGridLayout: Cell[][] | null;

  /** Robots currently in the simulation setup. */
  robots: Robot[];

  /** Tasks currently in the simulation setup. */
  tasks: Task[];

  /** Strategy selected for task assignment. */
  selectedStrategy: string | null;

  /** Status of the simulation: idle, running, or paused. */
  simulationStatus: SimulationStatus;

  /** Any error messages to show to the user. */
  errorMessages: string[];

  /** Whether the user is placing a robot or task (or nothing). */
  currentPlacementMode: PlacementMode;

  /** Update available grids. */
  setAvailableGrids: (grids: { id: string; name: string }[]) => void;

  /** Set selected grid and layout. */
  setSelectedGrid: (id: string, layout: Cell[][]) => void;

  /** Replace robots array. */
  setRobots: (robots: Robot[]) => void;

  /** Replace tasks array. */
  setTasks: (tasks: Task[]) => void;

  /** Add a single robot. */
  addRobot: (robot: Robot) => void;

  /** Add a single task. */
  addTask: (task: Task) => void;

  /** Set selected task assignment strategy. */
  setStrategy: (strategy: string) => void;

  /** Set simulation status. */
  setSimulationStatus: (status: SimulationStatus) => void;

  /** Add an error message to the list. */
  addError: (msg: string) => void;

  /** Clear all error messages. */
  clearErrors: () => void;

  /** Set current placement mode. */
  setPlacementMode: (mode: PlacementMode) => void;
}

/**
 * Zustand-based simulation state store for frontend.
 */
export const useSimulationStore = create<SimulationState>((set) => ({
  availableGrids: [],
  selectedGridId: null,
  selectedGridLayout: null,
  robots: [],
  tasks: [],
  selectedStrategy: null,
  simulationStatus: 'idle',
  errorMessages: [],
  currentPlacementMode: null,

  setAvailableGrids: (grids) => set({ availableGrids: grids }),
  setSelectedGrid: (id, layout) =>
    set({ selectedGridId: id, selectedGridLayout: layout }),
  setRobots: (robots) => set({ robots }),
  setTasks: (tasks) => set({ tasks }),
  addRobot: (robot) =>
    set((state) => ({ robots: [...state.robots, robot] })),
  addTask: (task) =>
    set((state) => ({ tasks: [...state.tasks, task] })),
  setStrategy: (strategy) => set({ selectedStrategy: strategy }),
  setSimulationStatus: (status) => set({ simulationStatus: status }),
  addError: (msg) =>
    set((state) => ({ errorMessages: [...state.errorMessages, msg] })),
  clearErrors: () => set({ errorMessages: [] }),
  setPlacementMode: (mode) => set({ currentPlacementMode: mode }),
}));

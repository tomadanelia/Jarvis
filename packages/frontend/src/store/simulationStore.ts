import { create } from 'zustand';
import type { Cell, Robot, Task, SimulationStatus as BackendSimulationStatus } from '../../../common/src/types';
import type { User, Session } from '@supabase/supabase-js';
import { logoutApi } from '../services/apiService';

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
type PlacementMode = 'robot' | 'task' | 'delete' | null;

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
  simulationStatus: BackendSimulationStatus;
  simulationTime: number;
  errorMessages: string[];
  currentPlacementMode: PlacementMode;
  myClientId: string | null;
  controllerClientId: string | null;
  // Auth state
  user: User | null;
  session: Session | null;

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
  setMyClientId: (id: string | null) => void;
  handleInitialState: (payload: InitialStatePayload) => void;
  handleSimulationUpdate: (payload: SimulationUpdatePayload) => void;
  handleSimulationEnded: (payload: SimulationEndedPayload) => void;
  // Auth actions
  setAuth: (user: User, session: Session) => void;
  logout: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  availableGrids: [],
  selectedGridId: null,
  selectedGridLayout: null,
  robots: [],
  tasks: [],
  selectedStrategy: null,
  simulationStatus: 'idle',
  simulationTime: 0,
  errorMessages: [],
  currentPlacementMode: null,
  myClientId: null,
  controllerClientId: null,
  // Auth state
  user: null,
  session: null,

  setAvailableGrids: (grids) => set({ availableGrids: grids }),
  setSelectedGrid: (id, layout) =>
    set({ selectedGridId: id, selectedGridLayout: layout, robots: [], tasks: [], simulationTime: 0, simulationStatus: 'idle' }),
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
  setMyClientId: (id) => set({ myClientId: id }),

  // Implement WebSocket payload handlers
  handleInitialState: (payload) => set({
    selectedGridLayout: payload.currentGrid,
    selectedGridId: payload.gridId,
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
    simulationStatus: 'running',
  }),
  handleSimulationEnded: (payload) => set({
    simulationStatus: 'idle',
    simulationTime: payload.simulationTime,
    controllerClientId: payload.controllerClientId,
  }),
  
  // Auth actions
  setAuth: (user, session) => set({ user, session }),
  logout: () => {
    logoutApi(); // Clear token from localStorage
    set({ user: null, session: null });
  },
}));
import type { Task, Robot, Cell, SimulationStatus } from '../../../common/src/types';

/**
 * Base URL for backend API calls.
 * Reads from environment variable and removes trailing slash if present.
 */
const BASE_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:3001';

/**
 * Fetch the list of available grids from the backend.
 *
 * @returns {Promise<any[]>} A promise resolving to an array of grid objects.
 * @throws Will throw an error if the request fails.
 */
export async function fetchGrids(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/grids`);
  if (!res.ok) throw new Error('Failed to fetch grids');
  return res.json();
}

/**
 * Fetch a specific grid's data by its ID.
 *
 * @param {string} id - The ID of the grid to fetch.
 * @returns {Promise<any>} A promise resolving to the grid data.
 * @throws Will throw an error if the request fails.
 */
export async function fetchGridById(id: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/grids/${id}`);
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`fetchGridById FAILED for ID ${id}. Status: ${res.status}. Response text: ${errorText}`);
    throw new Error(`Failed to fetch grid ${id}. Status: ${res.status}. Body: ${errorText}`);
  }
  return res.json();
}
/**
 * Setup the simulation with a given grid ID.
 *
 * @param {string} gridId - The ID of the grid to initialize the simulation with.
 * @returns {Promise<void>}
 * @throws Will throw an error if the setup fails.
 */
export async function setupSimulationApi(gridId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/setUp/${gridId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    console.error('setupSimulationApi FAILED. Status:', res.status);
    throw new Error(`Simulation setup failed with status: ${res.status}`);
  }
  console.log('setupSimulationApi SUCCEEDED');
}

/**
 * Place a robot in the simulation.
 *
 * @param {Robot} robot - The robot object to place in the simulation.
 * @returns {Promise<void>}
 * @throws Will throw an error if the placement fails.
 */
export async function placeRobotApi(robot: Robot): Promise<void> {
  const payload = {
    location: robot.currentLocation,
    iconType: robot.iconType,
  };

  const res = await fetch(`${BASE_URL}/api/simulation/placeRobot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`placeRobotApi FAILED. Status: ${res.status}. Response text: ${errorText}`);
    throw new Error(`Placing robot failed. Status: ${res.status}. Body: ${errorText}`);
  }
}

export async function placeTaskApi(task: Task): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/placeTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task.location),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`placeTaskApi FAILED. Status: ${res.status}. Response text: ${errorText}`);
    throw new Error(`Placing task failed. Status: ${res.status}. Body: ${errorText}`);
  }
}


export async function deleteObjectApi(location:any): Promise<void> {
   const res = await fetch(`${BASE_URL}/api/simulation/deleteObject`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(location), 
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`deleteObject FAILED. Status: ${res.status}. Response text: ${errorText}`);
    throw new Error(`Deleting task/or ovject failed. Status: ${res.status}. Body: ${errorText}`);
  }
}
/**
 * Select a task assignment strategy for the simulation.
 *
 * @param {string} strategy - The strategy name to apply.
 * @returns {Promise<void>}
 * @throws Will throw an error if the selection fails.
 */
export async function selectStrategyApi(strategy: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/selectStrategy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategy }),
  });
  if (!res.ok) throw new Error('Selecting strategy failed');
}

/**
 * Get the current simulation state including robots and tasks.
 *
 * @returns {Promise<any>} A promise resolving to the full simulation state.
 * @throws Will throw an error if the fetch fails.
 */
export async function getSimulationStateApi(): Promise<{
  currentGrid: Cell[][] | null;
  gridId: string | null;
  gridName: string | null;
  robots: Robot[];
  tasks: Task[];
  selectedStrategy: string | null;
  simulationStatus: SimulationStatus;
  simulationTime: number;
}> {
  const res = await fetch(`${BASE_URL}/api/simulation/getSetupState`);
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`getSimulationStateApi FAILED. Status: ${res.status}. Response text: ${errorText}`);
    throw new Error(`Failed to fetch simulation state. Status: ${res.status}. Body: ${errorText}`);
  }
  return res.json();
}

// --- Simulation Control APIs ---

/**
 * Command the backend to start the current simulation.
 */
export async function startSimulationControlApi(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/control/start`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Starting simulation failed. Status: ${res.status}. Message: ${errorBody}`);
  }
}

/**
 * Command the backend to pause the current simulation.
 */
export async function pauseSimulationControlApi(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/control/pause`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Pausing simulation failed. Status: ${res.status}. Message: ${errorBody}`);
  }
}

/**
 * Command the backend to resume the current simulation.
 */
export async function resumeSimulationControlApi(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/control/resume`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Resuming simulation failed. Status: ${res.status}. Message: ${errorBody}`);
  }
}

/**
 * Command the backend to reset the current simulation to its initial state.
 */
export async function resetSimulationControlApi(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/control/reset`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Resetting simulation failed. Status: ${res.status}. Message: ${errorBody}`);
  }
}

/**
 * Command the backend to set the simulation speed factor.
 * @param {number} factor The new speed factor.
 */
export async function setSpeedFactorControlApi(factor: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/control/speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ factor }),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Setting speed factor failed. Status: ${res.status}. Message: ${errorBody}`);
  }
}
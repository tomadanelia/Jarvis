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
// packages/frontend/src/services/apiService.ts
export async function fetchGridById(id: string): Promise<any> { // Consider defining a proper return type
  const res = await fetch(`${BASE_URL}/api/grids/${id}`); // Ensure BASE_URL is here
  if (!res.ok) {
    // Try to get more info from the response if it's not JSON
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
  const res = await fetch(`${BASE_URL}/api/simulation/setUp/${gridId}`, { // Critical: /setUp/:id
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // No body needed if gridId is in the URL param
  });
  if (!res.ok) {
    console.error('setupSimulationApi FAILED. Status:', res.status); // ADD THIS LOG
    throw new Error(`Simulation setup failed with status: ${res.status}`); // More informative error
  }
  console.log('setupSimulationApi SUCCEEDED'); // ADD THIS LOG
}
/**
 * Command the backend to start the current simulation.
 *
 * @returns {Promise<void>}
 * @throws Will throw an error if the command fails.
 */
export async function startSimulationControlApi(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/control/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // No body needed for this specific start command as per current backend
  });
  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`startSimulationControlApi FAILED. Status: ${res.status}. Body: ${errorBody}`);
    throw new Error(`Starting simulation failed. Status: ${res.status}. Message: ${errorBody}`);
  }
  console.log('startSimulationControlApi SUCCEEDED');
}
/**
 * Place a robot in the simulation.
 *
 * @param {Robot} robot - The robot object to place in the simulation.
 * @returns {Promise<void>}
 * @throws Will throw an error if the placement fails.
 */
export async function placeRobotApi(robot: Robot): Promise<void> {
  // The body for placeRobot on the backend expects { location, iconType }
  // Your frontend is sending the whole Robot object from common/types.
  // The backend controller for placeRobot is:
  //   const {location,iconType}=req.body;
  // This will work if `robot` object sent from frontend has `location` and `iconType` as top-level properties.
  // Your `Robot` type does have `currentLocation` (which should map to `location`) and `iconType`.
  // We might need to adjust the body sent or how the backend extracts it.
  // For now, let's fix the URL.
  // The backend controller expects: { location: Coordinates, iconType: string }
  // The common Robot type has: iconType: string, currentLocation: Coordinates
  // We should send what the backend expects.

  const payload = {
    location: robot.currentLocation, // Or robot.initialLocation depending on desired behavior
    iconType: robot.iconType,
  };

  const res = await fetch(`${BASE_URL}/api/simulation/placeRobot`, { // Corrected URL (no dash)
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), // Send only what the backend expects
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`placeRobotApi FAILED. Status: ${res.status}. Response text: ${errorText}`);
    throw new Error(`Placing robot failed. Status: ${res.status}. Body: ${errorText}`);
  }
}

export async function placeTaskApi(task: Task): Promise<void> {
  // Backend controller for placeTask is:
  //   const location=req.body;
  // It expects the location object directly as the body, not nested.
  // Your common Task type has: location: Coordinates
  // So sending task.location should be correct.

  const res = await fetch(`${BASE_URL}/api/simulation/placeTask`, { // Corrected URL (no dash)
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task.location), // Send only the location object
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`placeTaskApi FAILED. Status: ${res.status}. Response text: ${errorText}`);
    throw new Error(`Placing task failed. Status: ${res.status}. Body: ${errorText}`);
  }
}

/**
 * Select a task assignment strategy for the simulation.
 *
 * @param {string} strategy - The strategy name to apply (e.g., 'nearest-first').
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
 * Reset the current simulation setup to its initial state.
 *
 * @returns {Promise<void>}
 * @throws Will throw an error if the reset fails.
 */
export async function resetSetupApi(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/control/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Resetting setup failed');
}

/**
 * Get the current simulation state including robots and tasks.
 *
 * @returns {Promise<{ robots: Robot[]; tasks: Task[] }>} A promise resolving to an object with robots and tasks arrays.
 * @throws Will throw an error if the fetch fails.
 */
export async function getSimulationStateApi(): Promise<{
  currentGrid: Cell[][] | null; // Match what backend getSetupState returns
  gridId: string | null;
  gridName: string | null;
  robots: Robot[];
  tasks: Task[];
  selectedStrategy: string | null; // Or your SimulationStrategy type
  simulationStatus: SimulationStatus; // Your SimulationStatus type
  simulationTime: number;
}> {
  const res = await fetch(`${BASE_URL}/api/simulation/getSetupState`); // Correct endpoint
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`getSimulationStateApi FAILED. Status: ${res.status}. Response text: ${errorText}`);
    throw new Error(`Failed to fetch simulation state. Status: ${res.status}. Body: ${errorText}`);
  }
  return res.json();
}

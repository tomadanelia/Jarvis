import type { Task, Robot } from '../../../common/src/types';

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
  if (!res.ok) throw new Error('Failed to fetch grid');
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
  const res = await fetch(`${BASE_URL}/api/simulation/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gridId }),
  });
  if (!res.ok) throw new Error('Simulation setup failed');
}

/**
 * Place a robot in the simulation.
 *
 * @param {Robot} robot - The robot object to place in the simulation.
 * @returns {Promise<void>}
 * @throws Will throw an error if the placement fails.
 */
export async function placeRobotApi(robot: Robot): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/place-robot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(robot),
  });
  if (!res.ok) throw new Error('Placing robot failed');
}

/**
 * Place a task in the simulation.
 *
 * @param {Task} task - The task object to place in the simulation.
 * @returns {Promise<void>}
 * @throws Will throw an error if the placement fails.
 */
export async function placeTaskApi(task: Task): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/place-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Placing task failed');
}

/**
 * Select a task assignment strategy for the simulation.
 *
 * @param {string} strategy - The strategy name to apply (e.g., 'nearest-first').
 * @returns {Promise<void>}
 * @throws Will throw an error if the selection fails.
 */
export async function selectStrategyApi(strategy: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulation/select-strategy`, {
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
  const res = await fetch(`${BASE_URL}/api/simulation/reset`, {
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
  robots: Robot[];
  tasks: Task[];
}> {
  const res = await fetch(`${BASE_URL}/api/simulation/state`);
  if (!res.ok) throw new Error('Failed to fetch simulation state');
  return res.json();
}

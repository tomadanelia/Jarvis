import { useSimulationStore } from '../store/simulationStore'; // Note the '../'
/**
 * SimulationStatusDisplay Component
 *
 * A presentational React component that displays the current status
 * of the simulation, including:
 * - The simulation's execution status (idle, running, etc.)
 * - The current simulation time in seconds
 * - Any error messages recorded in the simulation state
 *
 * This component reads its data from a global Zustand store (`useSimulationStore`)
 * and will automatically re-render when any of the following store fields change:
 * - simulationStatus
 * - simulationTime
 *
 * No props are required or accepted. All required state is derived from the store.
 * ```
 *
 * @component
 * @returns {JSX.Element} A display panel showing simulation status and any errors.
 */
export default function SimulationStatusDisplay() {
  const { simulationStatus, simulationTime} = useSimulationStore();

  return (
    <div className="simulation-status-display">
      <h2>Simulation Status</h2>
      <p>Status: {simulationStatus}</p>
      <p>Time: {simulationTime} seconds</p>
    </div>
  );
};
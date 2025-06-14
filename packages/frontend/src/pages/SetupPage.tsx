// packages/frontend/src/pages/SetupPage.tsx


import GridSelector from '../components/GridSelector';
import GridDisplay from '../components/GridDisplay';
import { useSimulationStore } from '../store/simulationStore';

/**
 * SetupPage component.
 * 
 * This page allows users to:
 * - Select a grid layout
 * - Display the selected grid with robots and tasks
 * - Place robots and tasks by clicking on cells based on selected mode
 * - Reset placement mode
 * 
 * @component
 */
export default function SetupPage() {
  const {
    selectedGridLayout,
    robots,
    tasks,
    setPlacementMode,
    currentPlacementMode,
  } = useSimulationStore();

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Robot Task Simulation Setup</h1>

      {/* Grid Selector */}
      <GridSelector />

      {/* Placement Controls */}
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={() => setPlacementMode('robot')}
          style={{
            backgroundColor: currentPlacementMode === 'robot' ? '#add8e6' : '',
            marginRight: '1rem',
          }}
        >
          Set Robot Placement Mode
        </button>
        <button
          onClick={() => setPlacementMode('task')}
          style={{
            backgroundColor: currentPlacementMode === 'task' ? '#ffd580' : '',
            marginRight: '1rem',
          }}
        >
          Set Task Placement Mode
        </button>
        <button onClick={() => setPlacementMode(null)}>
          Clear Placement Mode
        </button>
      </div>

      {/* Grid Display */}
      <div style={{ marginTop: '2rem' }}>
        {selectedGridLayout ? (
          <GridDisplay layout={selectedGridLayout} robots={robots} tasks={tasks} />
        ) : (
          <p>Please select a grid to begin simulation.</p>
        )}
      </div>
    </div>
  );
}

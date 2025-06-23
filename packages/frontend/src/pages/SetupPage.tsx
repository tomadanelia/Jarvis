import GridSelector from '../components/GridSelector';
import GridDisplay from '../components/GridDisplay';
import { useSimulationStore } from '../store/simulationStore';
import StrategySelector from '../components/StrategySelector';
import ControlPanel from '../components/ControlPanel';
import InfoPanel from '../components/InfoPanel'; // Import the new component

export default function SetupPage() {
  const {
    selectedGridLayout,
    robots,
    tasks,
    setPlacementMode,
    currentPlacementMode,
  } = useSimulationStore();

  return (
    <div className="page-container">
      <div className="main-content">
        <h1>Robot Task Simulation Setup</h1>

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
            Place Robots
          </button>
          <button
            onClick={() => setPlacementMode('task')}
            style={{
              backgroundColor: currentPlacementMode === 'task' ? '#ffd580' : '',
              marginRight: '1rem',
            }}
          >
            Place Tasks
          </button>
          <button onClick={() => setPlacementMode('delete')}  style={{
              backgroundColor: currentPlacementMode === 'delete' ? 'pink' : '',
              marginRight: '1rem',
            }}>
            Delete Objects
           </button>
        </div>

        {/* Strategy Selector */}
        <StrategySelector />
        <ControlPanel />

        {/* Grid Display */}
        <div style={{ marginTop: '2rem' }}>
          {selectedGridLayout ? (
            <GridDisplay layout={selectedGridLayout} robots={robots} tasks={tasks} />
          ) : (
            <p>Please select a grid to begin simulation.</p>
          )}
        </div>
      </div>
      <div className="sidebar-content">
        <InfoPanel />
      </div>
    </div>
  );
}
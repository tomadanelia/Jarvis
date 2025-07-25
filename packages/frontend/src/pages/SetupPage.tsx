import GridSelector from '../components/GridSelector';
import GridDisplay from '../components/GridDisplay';
import { useSimulationStore } from '../store/simulationStore';
import StrategySelector from '../components/StrategySelector';
import ControlPanel from '../components/ControlPanel';
import InfoPanel from '../components/InfoPanel';
import SetupManager from '../components/SetupManager';
import "../components/components.css"
export default function SetupPage() {
  const {
    selectedGridLayout,
    robots,
    tasks,
    setPlacementMode,
    currentPlacementMode,
    user
  } = useSimulationStore();

  return (
    <div className="page-container">
      <div className="main-content">
        <h1>Robot Task Simulation Setup</h1>

     

        {/* Placement Controls */}
        <div style={{ marginTop: '1rem' }}>
          <button
          className='placement-button'
            onClick={() => setPlacementMode('robot')}
            style={{
              backgroundColor: currentPlacementMode === 'robot' ? '#add8e6' : '',
              marginRight: '1rem',
            }}
          >
            Place Robots
          </button>
          <button
            className='placement-button-charger'
            onClick={() => setPlacementMode('charger')}
            style={{
              backgroundColor: currentPlacementMode === 'charger' ? '#90ee90' : '',
              marginRight: '1rem',
            }}
          >
            Place Charger Robot
          </button>
          <button
            className='placement-button-task'
            onClick={() => setPlacementMode('task')}
            style={{
              backgroundColor: currentPlacementMode === 'task' ? '#ffd580' : '',
              marginRight: '1rem',
            }}
          >
            Place Tasks
          </button>
          <button 
            className='placement-button-delete'
          onClick={() => setPlacementMode('delete')}  style={{
              backgroundColor: currentPlacementMode === 'delete' ? 'pink' : '',
              marginRight: '1rem',
            }}>
            Delete Objects
           </button>
        </div>
           <div className='selectors'>
            <GridSelector />
   
        <StrategySelector />
             
           </div>
        <ControlPanel />
        {user && <SetupManager />}
        

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
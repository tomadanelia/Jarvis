import { useEffect, useState } from 'react';
import GridSelector from '../components/GridSelector';
import GridDisplay from '../components/GridDisplay';
import { useSimulationStore } from '../store/simulationStore';
import StrategySelector from '../components/StrategySelector';
import ControlPanel from '../components/ControlPanel';
import InfoPanel from '../components/InfoPanel';
import { 
  getUserSetupsApi, 
  saveSetupApi,
  loadSetupApi,
  deleteSetupApi 
} from '../services/apiService';

export default function SetupPage() {
  const {
    selectedGridLayout,
    robots,
    tasks,
    setPlacementMode,
    currentPlacementMode,
    user,
    savedSetups,
    setSavedSetups,
  } = useSimulationStore();

  const [selectedSetupId, setSelectedSetupId] = useState<string>('');

  // Fetch user's setups when they are logged in or when the list might change
  useEffect(() => {
    if (user) {
      const fetchSetups = async () => {
        try {
          const setups = await getUserSetupsApi();
          setSavedSetups(setups);
        } catch (error) {
          console.error("Failed to fetch user setups:", error);
          // Don't alert here, just log, to avoid being noisy.
        }
      };
      fetchSetups();
    } else {
      setSavedSetups([]);
    }
  }, [user, setSavedSetups]);

  const handleSaveSetup = async () => {
    const name = prompt("Please enter a name for your setup:");
    if (name) {
      try {
        await saveSetupApi(name);
        alert(`Setup "${name}" saved successfully!`);
        // Refresh the list
        const setups = await getUserSetupsApi();
        setSavedSetups(setups);
      } catch (error: any) {
        console.error("Failed to save setup:", error);
        alert(`Error saving setup: ${error.message}`);
      }
    }
  };
  
  const handleLoadSetup = async () => {
    if (!selectedSetupId) {
      alert("Please select a setup to load.");
      return;
    }
    try {
      await loadSetupApi(selectedSetupId);
      alert("Setup loaded successfully! The grid has been updated.");
    } catch(error: any) {
      console.error("Failed to load setup:", error);
      alert(`Error loading setup: ${error.message}`);
    }
  };

  const handleDeleteSetup = async () => {
    if (!selectedSetupId) {
      alert("Please select a setup to delete.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this setup? This cannot be undone.")) {
      try {
        await deleteSetupApi(selectedSetupId);
        alert("Setup deleted successfully.");
        setSelectedSetupId(''); // Reset selection
        // Refresh the list
        const setups = await getUserSetupsApi();
        setSavedSetups(setups);
      } catch(error: any) {
        console.error("Failed to delete setup:", error);
        alert(`Error deleting setup: ${error.message}`);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="main-content">
        <h1>Robot Task Simulation Setup</h1>

        <div className="top-controls-container">
          <GridSelector />
          {user && (
            <div className="setups-controls">
              <label htmlFor="setups-dropdown">My Setups:</label>
              <select
                id="setups-dropdown"
                value={selectedSetupId}
                onChange={(e) => setSelectedSetupId(e.target.value)}
                disabled={savedSetups.length === 0}
              >
                <option value="">-- Choose a setup --</option>
                {savedSetups.map((setup) => (
                  <option key={setup.id} value={setup.id}>{setup.name}</option>
                ))}
              </select>
              <button onClick={handleLoadSetup} disabled={!selectedSetupId}>Load</button>
              <button onClick={handleDeleteSetup} disabled={!selectedSetupId} className="delete-button">Delete</button>
            </div>
          )}
        </div>

        <div className="placement-controls-container">
          <div>
            <button
              onClick={() => setPlacementMode('robot')}
              className={currentPlacementMode === 'robot' ? 'active-placement' : ''}
            >
              Place Robots
            </button>
            <button
              onClick={() => setPlacementMode('task')}
              className={currentPlacementMode === 'task' ? 'active-placement' : ''}
            >
              Place Tasks
            </button>
            <button
              onClick={() => setPlacementMode('delete')}
              className={currentPlacementMode === 'delete' ? 'active-placement' : ''}
            >
              Delete Objects
            </button>
          </div>
          {user && (
            <button onClick={handleSaveSetup} className="save-button">Save Current Setup</button>
          )}
        </div>

        <StrategySelector />
        <ControlPanel />

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
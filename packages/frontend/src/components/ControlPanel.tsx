// packages/frontend/src/components/ControlPanel.tsx
import { useSimulationStore } from '../store/simulationStore';
import { startSimulationControlApi } from '../services/apiService';

export default function ControlPanel() {
  const simulationStatus = useSimulationStore((state) => state.simulationStatus);
  const selectedGridId = useSimulationStore((state) => state.selectedGridId);
  // If you need more, add more individual selectors:
  // const isLoading = useSimulationStore((state) => state.isLoading);

  const handleStartSimulation = async () => {
    if (!selectedGridId) {
      console.error('No grid selected');
      return;
    }

    try {
      await startSimulationControlApi();
      console.log('Simulation started successfully');
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  };

  return (
    <div style={{ marginTop: '1rem', padding: '10px', border: '1px solid #555' }}>
      <h2>Simulation Controls</h2>
      <button
        onClick={handleStartSimulation}
        disabled={simulationStatus === 'running' || !selectedGridId}
        style={{ marginRight: '10px' }}
      >
        Start Simulation
      </button>
      {/* ... other buttons ... */}
    </div>
  );
}
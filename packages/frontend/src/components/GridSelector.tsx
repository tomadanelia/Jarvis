import { useEffect, useState } from 'react';
import { fetchGridById, fetchGrids, setupSimulationApi } from '../services/apiService';
import { useSimulationStore } from '../store/simulationStore';

/**
 * GridSelector component.
 * 
 * Renders a dropdown menu for selecting a grid layout.
 * On mount, it fetches the list of available grids from the backend
 * and stores them in the Zustand store. On selection, it sets up the
 * simulation and updates the selected grid's layout.
 * 
 * @component
 */
export default function GridSelector() {
  /** Whether grid data is still loading */
  const [loading, setLoading] = useState(true);

  const {
    availableGrids,
    setAvailableGrids,
    setSelectedGrid,
  } = useSimulationStore();

  /**
   * Fetches list of available grids from backend on component mount.
   * Updates Zustand store with retrieved grid list.
   */
  useEffect(() => {
    const loadGrids = async () => {
      try {
        const grids = await fetchGrids();
        setAvailableGrids(grids);
      } catch (err) {
        console.error('Failed to fetch grids:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGrids();
  }, [setAvailableGrids]);

  /**
   * Handles the grid selection from the dropdown.
   * - Sets up the simulation on the backend using the selected grid ID.
   * - Fetches the full grid layout after setup.
   * - Updates Zustand store with the selected grid ID and layout.
   *
   * @param event - React change event from the grid dropdown selection
   */
  const handleSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
  const selectedGridId = event.target.value;
  if (!selectedGridId) return;

  try {
    await setupSimulationApi(selectedGridId);

    console.log('[GridSelector] Fetching grid details for ID:', selectedGridId);
    // const res = await fetch(`/api/grids/${selectedGridId}`); // OLD - Missing BASE_URL
    // const data = await res.json(); // OLD

    const gridData = await fetchGridById(selectedGridId); // NEW - Use apiService function

    setSelectedGrid(selectedGridId, gridData.layout); // Assuming fetchGridById returns { id, name, layout }
  } catch (err) {
    console.error('Failed to setup simulation:', err);
    // Add more specific error logging if needed
    if (err instanceof Error) {
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
    }
  }
};

  return (
    <div>
      <label htmlFor="grid-selector">Select a Grid:</label>
      <select id="grid-selector" onChange={handleSelect} disabled={loading}>
        <option value="">-- Choose Grid --</option>
        {availableGrids.map((grid) => (
          <option key={grid.id} value={grid.id}>
            {grid.name}
          </option>
        ))}
      </select>
    </div>
  );
}

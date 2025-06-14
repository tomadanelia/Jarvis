import { useEffect, useState } from 'react';
import { fetchGrids, setupSimulationApi } from '../services/apiService';
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

      const res = await fetch(`/api/grids/${selectedGridId}`);
      const data = await res.json();

      setSelectedGrid(selectedGridId, data.layout);
    } catch (err) {
      console.error('Failed to setup simulation:', err);
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

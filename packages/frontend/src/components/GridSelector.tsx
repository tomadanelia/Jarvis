import { useEffect, useState } from 'react';
import { fetchGrids, setupSimulationApi } from '../services/apiService';
import { useSimulationStore } from '../store/simulationStore';

/**
 * Dropdown component for selecting a grid layout from backend.
 * Fetches grids on mount and updates the simulation store accordingly.
 */
export default function GridSelector() {
  const [loading, setLoading] = useState(true);

  const {
    availableGrids,
    setAvailableGrids,
    setSelectedGrid,
  } = useSimulationStore();

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

  const handleSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGridId = event.target.value;
    try {
      await setupSimulationApi(selectedGridId);
      const res = await fetch(`/api/grids/${selectedGridId}`); // fallback in case you want layout too
      const data = await res.json();
      setSelectedGrid(selectedGridId, data.layout); // assumes layout is in `data.layout`
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

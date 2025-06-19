// packages/frontend/src/components/StrategySelector.tsx

import React, { useState } from 'react';
import { selectStrategyApi } from '../services/apiService';
import { useSimulationStore } from '../store/simulationStore';

/**
 * StrategySelector component.
 *
 * Renders a dropdown for selecting the task assignment strategy,
 * such as "Nearest Available Robot" or "Round-Robin".
 * Updates both backend and frontend store state.
 *
 * @component
 */
export default function StrategySelector() {
  const { selectedStrategy, setStrategy } = useSimulationStore();
  const [loading, setLoading] = useState(false);

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const strategy = event.target.value;
    if (!strategy) return;

    setLoading(true);
    try {
      await selectStrategyApi(strategy);
      setStrategy(strategy);
    } catch (error) {
      console.error('Failed to select strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <label htmlFor="strategy-selector" style={{ marginRight: '0.5rem' }}>
        Select Assignment Strategy:
      </label>
      <select
        id="strategy-selector"
        onChange={handleChange}
        value={selectedStrategy || ''}
        disabled={loading}
      >
        <option value="">-- Choose Strategy --</option>
        <option value="nearest-first">Nearest Available Robot</option>
        <option value="round-robin">Round-Robin</option>
      </select>
    </div>
  );
}

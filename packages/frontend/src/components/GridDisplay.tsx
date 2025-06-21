import React from 'react';
import type { Cell, Robot, Task } from '../../../common/src/types';
import { useSimulationStore } from '../store/simulationStore';
import { getSimulationStateApi, placeRobotApi, placeTaskApi } from '../services/apiService';
import SimulationStatusDisplay from './SimulationStatusDisplay';

/**
 * Props for GridDisplay component.
 */
interface GridDisplayProps {
  layout: Cell[][];
  robots: Robot[];
  tasks: Task[];
}

/**
 * A React component to visually render a simulation grid layout,
 * including cells, robots, and tasks. Also handles click interactions
 * for placing robots or tasks.
 *
 * @param layout - 2D grid layout of Cell objects.
 * @param robots - List of robots currently on the grid.
 * @param tasks - List of tasks currently on the grid.
 */
const GridDisplay: React.FC<GridDisplayProps> = ({ layout, robots, tasks }) => {
  const {
    currentPlacementMode,
    setRobots,
    setTasks,
    selectedGridId,
  } = useSimulationStore();

  /**
   * Fetches updated simulation state from backend and updates store.
   * this is no longer used but i will keep it alive for now
   */
const refreshSimulationState = async () => {
    try {
      console.log('[GridDisplay] Refreshing simulation state...');
      const updatedState = await getSimulationStateApi(); // Use the service function
      console.log('[GridDisplay] Fetched updated state:', updatedState);
      setRobots(updatedState.robots);
      setTasks(updatedState.tasks);
      console.log('[GridDisplay] Simulation state refreshed and store updated.');
    } catch (error) {
      console.error('[GridDisplay] Failed to refresh simulation state:', error);
    }
  };


  /**
   * Handles clicking on a grid cell based on the current placement mode.
   * @param x - X coordinate of the clicked cell.
   * @param y - Y coordinate of the clicked cell.
   */
  const handleCellClick = async (x: number, y: number) => {
    if (!currentPlacementMode || !selectedGridId) return;

    try {
      const coordinates = { x, y };

      if (currentPlacementMode === 'robot') {
        await placeRobotApi({ currentLocation: coordinates, iconType: '🤖' } as Robot); // Cast for type, apiService extracts

      } else if (currentPlacementMode === 'task') {
        await placeTaskApi({ location: coordinates } as Task); // Cast for type, apiService extracts

      }

    } catch (err) {
      console.error('Failed to place item:', err);
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <SimulationStatusDisplay/>
      {layout.map((row, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {row.map((cell, x) => {
            let bgColor = '#eee';
            if (cell.type === 'walkable') bgColor = '#ccc';
            else if (cell.type === 'wall') bgColor = '#333';
            else if (cell.type === 'chargingStation') bgColor = 'gold';

            const robot = robots.find(r => r.currentLocation.x === x && r.currentLocation.y === y);
            const task = tasks.find(t => t.location.x === x && t.location.y === y);

            return (
              <div
                key={x}
                onClick={() => handleCellClick(x, y)}
                style={{
                  width: 17,
                  height: 17,
                  backgroundColor: bgColor,
                  border: '1px solid #999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentPlacementMode ? 'pointer' : 'default',
                }}
              >
                {robot ? '🤖' : task ? '📦' : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GridDisplay;

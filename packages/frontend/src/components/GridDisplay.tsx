import React from 'react';
import type { Cell, Robot, Task } from '../../../common/src/types';
import { useSimulationStore } from '../store/simulationStore';
import { placeRobotApi, placeTaskApi } from '../services/apiService';

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
   */
  const refreshSimulationState = async () => {
    const updatedState = await fetch('/api/simulation/state').then((r) => r.json());
    setRobots(updatedState.robots);
    setTasks(updatedState.tasks);
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
        await placeRobotApi({
          id: crypto.randomUUID(),
          iconType: '🤖',
          battery: 100,
          maxBattery: 100,
          status: 'idle',
          movementCostPerCell: 1,
          consecutiveWaitSteps: 0,
          currentLocation: coordinates,
          initialLocation: coordinates,
        });
      } else if (currentPlacementMode === 'task') {
        await placeTaskApi({
          id: crypto.randomUUID(),
          location: coordinates,
          status: 'unassigned',
          workDuration: 5,
          batteryCostToPerform: 10,
        });
      }

      await refreshSimulationState();
    } catch (err) {
      console.error('Failed to place item:', err);
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
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
                  width: 30,
                  height: 30,
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

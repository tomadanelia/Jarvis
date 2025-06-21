// packages/frontend/src/components/GridDisplay.tsx

import React from 'react';
import type { Cell, Robot, Task } from '../../../common/src/types';
import { useSimulationStore } from '../store/simulationStore';
import { placeRobotApi, placeTaskApi } from '../services/apiService';
import SimulationStatusDisplay from './SimulationStatusDisplay';

// --- NEW: Define the list of available robot icons ---
const ROBOT_ICONS = [
  'robot1.png',
  'robot2.png',
  'robot3.png',
  'robot4.png',
  'robot5.png',
  'robot3.png',
];

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
    selectedGridId,
  } = useSimulationStore();

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
        // --- MODIFIED: Cycle through icons instead of using '🤖' ---
        // We use the number of current robots to pick the next icon from our list
        const nextIcon = ROBOT_ICONS[robots.length % ROBOT_ICONS.length];
        await placeRobotApi({ currentLocation: coordinates, iconType: nextIcon } as Robot);

      } else if (currentPlacementMode === 'task') {
        await placeTaskApi({ location: coordinates } as Task);
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
                  // --- MODIFIED: Increased cell size for better visuals ---
                  width: 32,
                  height: 32,
                  backgroundColor: bgColor,
                  border: '1px solid #999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentPlacementMode ? 'pointer' : 'default',
                  position: 'relative', // Needed for positioning children if any
                }}
              >
                {/* --- MODIFIED: Render an <img> for the robot --- */}
                {robot ? (
                  <img
                    src={`/assets/robots/${robot.iconType}`}
                    alt="robot"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : task ? '📦' : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GridDisplay;
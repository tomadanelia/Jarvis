// packages/frontend/src/components/GridDisplay.tsx

import React from 'react';
import type { Cell, Robot, RobotStatus, Task, TaskStatus } from '../../../common/src/types';
import { useSimulationStore } from '../store/simulationStore';
import { placeRobotApi, placeTaskApi } from '../services/apiService';
import SimulationStatusDisplay from './SimulationStatusDisplay';

// --- CONFIGURATION CONSTANTS ---
const CELL_SIZE = 32; // The size of each grid cell in pixels. Let's stick with 32x32.
const LOW_BATTERY_THRESHOLD = 20; // Matches backend constant
const ROBOT_TRANSITION_DURATION_MS = 500; // Animation speed for robot movement

const ROBOT_ICONS = [
  'robot_blue.png',
  'robot_green.png',
  'robot_red.png',
  'robot_yellow.png',
  'robot_purple.png',
  'robot_orange.png',
];

// --- STYLES and ANIMATIONS ---
// We can define our CSS animations right here for simplicity.
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .task-spinner {
    border: 3px solid #f3f3f3; /* Light grey */
    border-top: 3px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 12px;
    height: 12px;
    animation: spin 1s linear infinite;
  }
`;

// --- HELPER COMPONENTS to keep the main render clean ---

/**
 * Renders a single Robot with smooth animation and a low battery indicator.
 */
const RobotVisual: React.FC<{ robot: Robot }> = ({ robot }) => (
  <div
    style={{
      position: 'absolute',
      width: CELL_SIZE,
      height: CELL_SIZE,
      // The transform property is what we animate for smooth movement.
      transform: `translate(${robot.currentLocation.x * CELL_SIZE}px, ${robot.currentLocation.y * CELL_SIZE}px)`,
      transition: `transform ${ROBOT_TRANSITION_DURATION_MS}ms linear`,
      zIndex: 10, // Ensure robots are on top of tasks
    }}
  >
    <img
      src={`/assets/robots/${robot.iconType}`}
      alt="robot"
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
    {/* Low battery indicator */}
    {robot.battery < LOW_BATTERY_THRESHOLD && (
      <div
        title={`Low Battery: ${robot.battery}%`}
        style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '8px',
          height: '8px',
          backgroundColor: 'red',
          borderRadius: '50%',
          border: '1px solid white',
        }}
      />
    )}
  </div>
);

/**
 * Renders a Task with different visuals based on its status.
 */
const TaskVisual: React.FC<{ task: Task, robotOnTask: Robot | undefined }> = ({ task, robotOnTask }) => {
  let visual;
  // A task is 'in_progress' if its status says so, OR if a robot is at its location and is 'performingTask'.
  // This makes the UI robust even if the backend task status update is slightly delayed.
  const isInProgress = task.status === 'inProgress' || (robotOnTask && robotOnTask.status === 'performingTask');

  if (isInProgress) {
    visual = <div className="task-spinner" title="Task in progress" />;
  } else {
    switch (task.status) {
      case 'unassigned':
        visual = <div title="Unassigned Task" style={{ width: 12, height: 12, backgroundColor: '#007bff', borderRadius: '50%' }} />;
        break;
      case 'assigned':
        visual = <div title="Assigned Task" style={{ width: 12, height: 12, backgroundColor: '#ffc107', borderRadius: '50%' }} />;
        break;
      case 'completed':
        visual = <span title="Task Completed" style={{ color: '#28a745', fontSize: '20px', fontWeight: 'bold' }}>✔</span>;
        break;
      default:
        visual = null;
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        width: CELL_SIZE,
        height: CELL_SIZE,
        transform: `translate(${task.location.x * CELL_SIZE}px, ${task.location.y * CELL_SIZE}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
      }}
    >
      {visual}
    </div>
  );
};


/**
 * Main GridDisplay Component
 */
const GridDisplay: React.FC = () => {
  const {
    currentPlacementMode,
    selectedGridId,
    selectedGridLayout: layout, // Renamed for clarity
    robots,
    tasks,
  } = useSimulationStore();

  const handleCellClick = async (x: number, y: number) => {
    if (!currentPlacementMode || !selectedGridId) return;
    try {
      const coordinates = { x, y };
      if (currentPlacementMode === 'robot') {
        const nextIcon = ROBOT_ICONS[robots.length % ROBOT_ICONS.length];
        await placeRobotApi({ currentLocation: coordinates, iconType: nextIcon } as Robot);
      } else if (currentPlacementMode === 'task') {
        await placeTaskApi({ location: coordinates } as Task);
      }
    } catch (err) {
      console.error('Failed to place item:', err);
    }
  };

  // Render a loading state or message if there's no layout
  if (!layout) {
    return <div>Select a grid to start...</div>;
  }

  return (
    <>
      <style>{styles}</style> {/* Inject our keyframes and styles */}
      <SimulationStatusDisplay/>
      
      {/* The main container needs position: relative for the absolute positioning of robots/tasks */}
      <div style={{
        position: 'relative',
        width: layout[0].length * CELL_SIZE,
        height: layout.length * CELL_SIZE,
        margin: '20px auto', // Center the grid
      }}>

        {/* Layer 1: The Grid Cells (background) */}
        {layout.map((row, y) => (
          <div key={`row-${y}`} style={{ display: 'flex' }}>
            {row.map((cell, x) => {
              let bgColor = '#eee';
              if (cell.type === 'walkable') bgColor = '#f0f0f0';
              else if (cell.type === 'wall') bgColor = '#333';
              else if (cell.type === 'chargingStation') bgColor = 'gold';

              return (
                <div
                  key={`cell-${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: bgColor,
                    border: '1px solid #ccc',
                    cursor: currentPlacementMode ? 'pointer' : 'default',
                  }}
                />
              );
            })}
          </div>
        ))}
        
        {/* Layer 2: The Tasks */}
        {tasks.map(task => {
          // Find if a robot is currently on this task's location
          const robotOnTask = robots.find(r => r.currentLocation.x === task.location.x && r.currentLocation.y === task.location.y);
          return <TaskVisual key={task.id} task={task} robotOnTask={robotOnTask} />;
        })}

        {/* Layer 3: The Robots */}
        {robots.map(robot => (
          <RobotVisual key={robot.id} robot={robot} />
        ))}
      </div>
    </>
  );
};

export default GridDisplay;
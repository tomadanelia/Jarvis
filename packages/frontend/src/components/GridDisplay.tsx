import React, { useMemo } from 'react'; // Import useMemo
import type { Cell, Robot, Task } from '../../../common/src/types';
import { useSimulationStore } from '../store/simulationStore';
import { deleteObjectApi, placeRobotApi, placeTaskApi } from '../services/apiService';
import SimulationStatusDisplay from './SimulationStatusDisplay';

const ROBOT_ICONS = [
  '/assets/robots/robot1.png',
  '/assets/robots/robot2.png',
  '/assets/robots/robot3.png',
  '/assets/robots/robot4.png',
  '/assets/robots/robot5.png',
];

const CELL_SIZE = 18;
const LOW_BATTERY_THRESHOLD = 20;

interface GridDisplayProps {
  layout: Cell[][];
  robots: Robot[];
  tasks: Task[];
}

const RobotVisual: React.FC<{ robot: Robot }> = ({ robot }) => {
  const isLowBattery = robot.battery < LOW_BATTERY_THRESHOLD && robot.type === 'worker';
  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${robot.currentLocation.y * CELL_SIZE}px`,
    left: `${robot.currentLocation.x * CELL_SIZE}px`,
    width: `${CELL_SIZE}px`,
    height: `${CELL_SIZE}px`,
    transition: 'top 0.4s ease-in-out, left 0.4s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  };

  return (
    <div style={style}>
      <img
        src={robot.iconType}
        alt="robot"
        style={{ width: '90%', height: '90%', objectFit: 'contain' }}
      />
      {isLowBattery && <div className="low-battery-indicator" />}
    </div>
  );
};

const TaskVisual: React.FC<{ task: Task }> = ({ task }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${task.location.y * CELL_SIZE}px`,
    left: `${task.location.x * CELL_SIZE}px`,
    width: `${CELL_SIZE}px`,
    height: `${CELL_SIZE}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5
  };

  const isWorking = task.status === 'inProgress';

  return (
    <div style={style}>
      <div className={`task-icon ${isWorking ? 'in-progress' : ''}`} />
    </div>
  );
};

const GridDisplay: React.FC<GridDisplayProps> = ({ layout, robots, tasks }) => {
  const { currentPlacementMode, selectedGridId } = useSimulationStore();
  
  // --- THIS IS THE FIX ---
  // 1. Select the raw robots array from the store.
  const allRobots = useSimulationStore(state => state.robots);

  // 2. Use `useMemo` to create the filtered array. This will only re-calculate
  //    `workerRobots` when the `allRobots` array reference changes.
  const workerRobots = useMemo(() => allRobots.filter(r => r.type === 'worker'), [allRobots]);
  // --- END OF FIX ---

  const handleCellClick = async (x: number, y: number) => {
    if (!currentPlacementMode || !selectedGridId) return;
    try {
      const coordinates = { x, y };

      if (currentPlacementMode === 'robot') {
        const nextIcon = ROBOT_ICONS[workerRobots.length % ROBOT_ICONS.length];
        await placeRobotApi({ currentLocation: coordinates, iconType: nextIcon }, 'worker');
      } 
      else if (currentPlacementMode === 'charger') {
        const chargerIcon = '/assets/robots/charger-robot.png';
        await placeRobotApi({ currentLocation: coordinates, iconType: chargerIcon }, 'charger');
      } 
      else if (currentPlacementMode === 'task') {
        await placeTaskApi({ location: coordinates } as Task);
      }
      else if (currentPlacementMode === 'delete') {
        await deleteObjectApi(coordinates);
      }

    } catch (err) {
      console.error('Failed to place item:', err);
    }
  };

  return (
    <div>
      <SimulationStatusDisplay />

      <div className="grid-container">
        <div className="grid-background">
          {layout.map((row, y) => (
            <div key={`row-${y}`} style={{ display: 'flex' }}>
              {row.map((cell, x) => {
                let bgColor = '#2d3748';
                if (cell.type === 'walkable') bgColor = '#4a5568';
                else if (cell.type === 'wall') bgColor = '#2d3748';
                else if (cell.type === 'chargingStation') bgColor = '#38b2ac';

                return (
                  <div
                    key={`cell-${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    style={{
                      width: `${CELL_SIZE}px`,
                      height: `${CELL_SIZE}px`,
                      backgroundColor: bgColor,
                      boxSizing: 'border-box',
                      cursor: currentPlacementMode ? 'pointer' : 'default',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="item-layer">
          {tasks.map(task => (
            <TaskVisual key={task.id} task={task} />
          ))}
        </div>

        <div className="item-layer">
          {robots.map(robot => (
            <RobotVisual key={robot.id} robot={robot} />
          ))}
        </div>
      </div>
    </div>
  );
};
 
export default GridDisplay;
import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import type { Robot } from '../../../common/src/types';

/**
 * A helper function to format the robot's target for display.
 * @param robot The robot object.
 * @returns A user-friendly string describing the robot's current target.
 */
const formatTarget = (robot: Robot): string => {
  switch (robot.status) {
    case 'onTaskWay':
    case 'performingTask':
      return robot.assignedTaskId ? `Task: ${robot.assignedTaskId.substring(0, 8)}...` : 'Task';
    case 'onChargingWay':
    case 'charging':
      return robot.currentTarget ? `Charger @ (${robot.currentTarget.x}, ${robot.currentTarget.y})` : 'Charger';
    default:
      return 'None';
  }
};

/**
 * A sub-component to render a visual battery bar.
 */
const BatteryBar: React.FC<{ battery: number }> = ({ battery }) => {
  const percentage = Math.round(battery);
  let barColor = '#4caf50'; // Green
  if (percentage < 50) barColor = '#ffc107'; // Yellow
  if (percentage < 20) barColor = '#f44336'; // Red

  return (
    <div className="battery-bar-container">
      <div
        className="battery-bar-level"
        style={{ width: `${percentage}%`, backgroundColor: barColor }}
      />
    </div>
  );
};

/**
 * Displays a list of all robots and their current status, battery, and target.
 */
export default function InfoPanel() {
  const robots = useSimulationStore(state => state.robots);

  return (
    <div className="info-panel">
      <h2>Robot Information</h2>
      {robots.length === 0 ? (
        <p>No robots have been placed on the grid.</p>
      ) : (
        <ul>
          {robots.map(robot => (
            <li key={robot.id} className="robot-info-card">
              <div className="robot-info-icon">
                <img src={robot.iconType} alt="robot icon" />
              </div>
              <div className="robot-info-details">
                <span className="robot-id">ID: {robot.id.substring(0, 8)}</span>
                <span className="robot-status">Status: {robot.status}</span>
                <span className="robot-target">Target: {formatTarget(robot)}</span>
                <div className="robot-battery-info">
                  <span>{Math.round(robot.battery)}%</span>
                  <BatteryBar battery={robot.battery} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
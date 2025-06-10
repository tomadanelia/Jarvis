import {  simulationStateService } from './simulationStateService';
import { DEFAULT_MOVEMENT_COST_PER_CELL } from 'src/config/constants';


/**
 * Moves the specified robot one step along its current path.
 *
 * Decrements the robot's battery by the default movement cost and updates its location.
 * If the robot does not exist or has no path to follow, returns false.
 *
 * @param {string} robotId - The ID of the robot to move.
 * @returns {boolean} True if the robot was moved successfully, false otherwise.
 */
export function moveRobotOneStep(robotId: string): boolean {
   simulationStateService.getRobotById(robotId);
    const robot = simulationStateService.getRobotById(robotId);
    if (!robot) {
      console.warn(`ROBOT_SERVICE: Robot with ID ${robotId} not found.`);
      return false;
    }
    else if(!robot.currentPath || robot.currentPath.length === 0) {
      console.warn(`ROBOT_SERVICE: Robot ${robotId} has no path to follow.`);
      return false;
    }
    const nextStep=robot.currentPath[0];
    robot.currentLocation=nextStep;
    robot.battery-=DEFAULT_MOVEMENT_COST_PER_CELL;
    robot.currentPath.shift();
    return true;
  }



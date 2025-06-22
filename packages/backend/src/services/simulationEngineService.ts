import { simulationStateService, SimulationStateService } from "./simulationStateService";
import { PathfindingService, pathfindingService } from "./pathfindingService";
import { BASE_SIMULATION_STEP_INTERVAL_MS, CHARGING_DURATION_STEPS, DEFAULT_SIMULATION_SPEED_FACTOR, LOW_BATTERY_THRESHOLD, ROBOT_MAX_CONSECUTIVE_WAIT_STEPS_FOR_REPATH } from "../config/constants";
import { moveRobotOneStep } from "./robotService";
import { Cell, Coordinates, Robot, Task } from "@common/types";
import { taskAssignmentService, TaskAssignmentService } from "./taskAssignmentService";
import { webSocketManager } from './webSocketManager';
import { supabaseService } from './supabaseService';



/*Based on the TODO and the service roles, startSimulation() should:
Check if a grid is currently loaded in SimulationStateService. (You can't start a simulation without an environment).
Set the simulationStatus in SimulationStateService to 'running'.
Reset the simulationTime in SimulationStateService to 0. (The TODO implies resetSimulationSetup does this, but it's good to be explicit here too, or ensure resetSimulationSetup is called before start if that's the desired flow - the current plan implies resetSetup is a separate button/action). Let's assume startSimulation resets time.
Call the initial task assignment logic (e.g., taskAssignmentService.assignTasksOnInit()). This assigns the first batch of tasks based on the strategy.
Start the setInterval that will repeatedly call the engine's step() method.*/
export class SimulationEngineService {
  private pathfindingService: PathfindingService;
  private simulationStateService: SimulationStateService;
  private taskAssignmentService: TaskAssignmentService;
  private intervalId: NodeJS.Timeout | null = null; // Store the interval ID
  private speedFactor: number = DEFAULT_SIMULATION_SPEED_FACTOR; // To control speed
  private rechargeCount = 0; // tracks how many times robots completed a full recharge

  /**
   * Creates a new SimulationEngineService.
   * @param simulationStateService The simulation state service instance.
   * @param pathfindingService The pathfinding service instance.
   * @param taskAssignmentService (Optional) The task assignment service instance.
   */
  public constructor(
    simulationStateService: SimulationStateService,
    pathfindingService: PathfindingService,
   taskAssignmentService: TaskAssignmentService,
  ) {
    this.simulationStateService = simulationStateService;
    this.pathfindingService = pathfindingService;
    this.taskAssignmentService = taskAssignmentService;
  }

  /**
   * Executes one simulation step (tick).
   *
   * Core simulation logic for a single tick:
   * 1. Increments the simulation time.
   * 2. Processes each robot (movement, task work, charging, decision making) using StateService, TaskAssignmentService, and pathfinding.
   * 3. Checks simulation end conditions; if all tasks are completed, ends the simulation.
   * 4. Broadcasts the updated simulation state via WebSocketManager.
   *
   * Should only execute if the simulation status is 'running'.
   * @private
   */
  private step(): void {
    console.log(`SIM_ENGINE_STEP_START: --- Step ${this.simulationStateService.getSimulationTime()} --- Status: ${this.simulationStateService.getSimulationStatus()}`);
    if (this.simulationStateService.getSimulationStatus() !== 'running') {
         console.warn("SIM_ENGINE_STEP_WARN: Step called but status is not 'running'. Exiting step.");
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                console.warn("SIM_ENGINE_STEP_WARN: Cleared stray interval.");
            }
            return;
    }

    this.simulationStateService.incrementSimulationTime();
    const currentTick = this.simulationStateService.getSimulationTime();
    const movementIntentions = this.determineMovementIntentions();
    const approvedMovers = this.resolveMovementConflicts(movementIntentions);
    this.executeApprovedMovements(approvedMovers);
    this.processAllRobotLogicAfterMovement();
    const task = this.simulationStateService.getTasks();
        if (task.length > 0 && task.every(task => task.status === 'completed')) {
            console.log(`SIM_ENGINE_STEP (Tick ${currentTick}): All tasks completed. Ending simulation.`);
            this.endSimulation(); 
            return;
        }
    console.log(`SIM_ENGINE_STEP_END (Tick ${currentTick}): Broadcasting simulation update.`);
        webSocketManager.broadcastSimulationUpdate();
    }

   

  /**
   * 
   * @returns Starts the simulation by initializing the simulation state and starting the interval for simulation steps.
   * @throws Error if no grid is loaded or if the simulation is already running.
   */
  public async startSimulation(): Promise<void> {
    if (!this.simulationStateService.getCurrentGrid()) {
      throw new Error("SIM_ENGINE_SERVICE: Cannot start simulation, no grid loaded.");
      return; 
    }
    if (this.simulationStateService.getSimulationStatus() === 'running') {
            console.log('SIM_ENGINE: Simulation is already running.');
            return; 
        }

    this.simulationStateService.setSimulationStatus('running');
    webSocketManager.broadcastInitialStateToAll(); // ✅ Initial state

    if (this.taskAssignmentService) {
       this.taskAssignmentService.assignTasksOnInit();
    }
    const intervalDelay = BASE_SIMULATION_STEP_INTERVAL_MS / this.speedFactor;
        if (intervalDelay <= 0 || !Number.isFinite(intervalDelay)) {
             console.warn(`SIM_ENGINE: Invalid speed factor ${this.speedFactor} resulted in invalid delay ${intervalDelay}. Defaulting to base delay.`);
             this.speedFactor = DEFAULT_SIMULATION_SPEED_FACTOR; 
             const defaultDelay = BASE_SIMULATION_STEP_INTERVAL_MS / this.speedFactor;
             this.intervalId = setInterval(() => this.step(), defaultDelay);
        } else {
             // Start the interval
             this.intervalId = setInterval(() => this.step(), intervalDelay);
        }


        console.log(`SIM_ENGINE: Simulation interval started (${intervalDelay}ms per step).`);
        

   
  }
  /**
   * Pauses the simulation by clearing the simulation interval and setting the status to 'paused'.
   */
  public pauseSimulation(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.simulationStateService.setSimulationStatus('paused');
            console.log('SIM_ENGINE: Simulation paused.');
        }
    }

  /**
   * Resumes the simulation if it is currently paused and the interval is not active.
   */
  public resumeSimulation(): void {
         if (this.intervalId === null && this.simulationStateService.getSimulationStatus() === 'paused') {
            console.log('SIM_ENGINE: Resuming simulation...');
             this.simulationStateService.setSimulationStatus('running');
             const intervalDelay = BASE_SIMULATION_STEP_INTERVAL_MS / this.speedFactor;
             this.intervalId = setInterval(() => this.step(), intervalDelay);
             console.log(`SIM_ENGINE: Simulation interval resumed (${intervalDelay}ms per step).`);
         } else {
             console.log('SIM_ENGINE: Cannot resume. Simulation is not paused or interval already active.');
             throw new Error("could not resume simulation already running")
         }
    }

  /**
   * Resets the simulation engine state by pausing the simulation and resetting the simulation setup.
   */
  public resetSimulation(): void {

        console.log('SIM_ENGINE: Resetting engine state.');
        this.pauseSimulation(); // Stop the interval
        this.simulationStateService.resetSimulationSetup();
        webSocketManager.broadcastInitialStateToAll();

    }

  /**
   * Sets the simulation speed factor and restarts the simulation interval if running.
   * @param factor The new speed factor (must be a positive finite number).
   */
  public setSpeedFactor(factor: number): void {
        if (factor > 0 && Number.isFinite(factor)) {
            this.speedFactor = factor;
            console.log(`SIM_ENGINE: Speed factor set to ${this.speedFactor}.`);
            if (this.simulationStateService.getSimulationStatus() === 'running' && this.intervalId !== null) {
                console.log('SIM_ENGINE: Restarting interval with new speed.');
                this.pauseSimulation();
                this.startSimulation(); 
            }
        } else {
            console.warn(`SIM_ENGINE: Invalid speed factor received: ${factor}`);
        }
    }

  /**
   * Ends the simulation by pausing it, setting the status to 'idle', and performing any cleanup or finalization.
   * @private
   */
  private async endSimulation(): Promise<void> {
    this.pauseSimulation();
    this.simulationStateService.setSimulationStatus('idle');
    webSocketManager.broadcastSimulationEnded();
  
    const result = {
      gridId: this.simulationStateService.getCurrentGridId() ?? "",
      gridName: this.simulationStateService.getCurrentGridName() ?? "",
      strategy: this.simulationStateService.getSelectedStrategy() ?? "unknown",
      totalTime: this.simulationStateService.getSimulationTime(),
      totalRecharges: this.rechargeCount,
    };
  
    try {
        await supabaseService.saveSimulationResult(result);

      console.log("SIM_ENGINE: metrics stored in Supabase.");
    } catch (err: any) {
      console.error("SIM_ENGINE: metric save failed:", err.message);
    }
}

  /**
     * @specification
     * optimized by checking if multiple robots intend to move to the same cell only when they are on their way to a task or charger.
     * @returns A map of robot IDs to their next intended movement coordinates, or null if no movement is intended.
     * @param no parameters
     * 
     * */

    private determineMovementIntentions(): Map<string, Coordinates | null> { 
    const intentions = new Map<string, Coordinates | null>();
    const robots = this.simulationStateService.getRobots();

    for (const robot of robots) {
        let nextCell: Coordinates | null = null;
        if ((robot.status === 'onTaskWay' || robot.status === 'onChargingWay') &&
            robot.currentPath && robot.currentPath.length > 0) {
            nextCell = robot.currentPath[0];
        }
        intentions.set(robot.id, nextCell);
    }
    return intentions;
}
    /**
     * Resolves movement conflicts by checking if multiple robots intend to move to the same cell.
     * If conflicts are found, it randomly selects one robot to move and sets others to wait.
     * @param intentions A map of robot IDs to their intended movement coordinates.
     * @returns A Set of robot IDs to their approved movement coordinates.
     */ 
private resolveMovementConflicts(intentions: Map<string, Coordinates | null>): Set<string> {
    const approvedToMove = new Set<string>();
    const robots = this.simulationStateService.getRobots();
    const sortedRobots = [...robots].sort((a, b) => a.id.localeCompare(b.id));
/**
 *  If otherRobot is at my target, 
 * it can only be okay if otherRobot is *also* moving *out* of that cell AND otherRobot has 
 * higher priority (already processed and approved) OR is moving to a different cell.
 * 
 */
    for (const robot of sortedRobots) {
        const intendedNextCell = intentions.get(robot.id);

        if (!intendedNextCell) {
            continue;
        }

        let canMoveThisTick = true;
        for (const otherRobot of robots) {
            if (robot.id === otherRobot.id) continue;
            if (otherRobot.currentLocation.x === intendedNextCell.x &&
                otherRobot.currentLocation.y === intendedNextCell.y) {
                const otherRobotIntention = intentions.get(otherRobot.id);
                if (!approvedToMove.has(otherRobot.id) || 
                    (otherRobotIntention && 
                     otherRobotIntention.x === intendedNextCell.x &&
                     otherRobotIntention.y === intendedNextCell.y)) {
                   canMoveThisTick = false;
robot.waitingBecauseOfRobotId = otherRobot.id; 
console.log(`SIM_ENGINE_CONFLICT ... Robot ${robot.id} ... but ${otherRobot.id} is there...`);
break;
                }
            }
            if (approvedToMove.has(otherRobot.id)) {
                const otherRobotApprovedIntention = intentions.get(otherRobot.id); 
                if (otherRobotApprovedIntention &&
                    otherRobotApprovedIntention.x === intendedNextCell.x &&
                    otherRobotApprovedIntention.y === intendedNextCell.y) {
                    canMoveThisTick = false;
                    console.log(`SIM_ENGINE_CONFLICT (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robot.id} yielding for ${intendedNextCell.x},${intendedNextCell.y} to higher priority ${otherRobot.id}.`);
                    break;
                }
            }
        }

        if (canMoveThisTick) {
            approvedToMove.add(robot.id);
            this.simulationStateService.updateRobotState(robot.id, { consecutiveWaitSteps: 0 }); 
        } else {
            const currentRobotState = this.simulationStateService.getRobotById(robot.id)!;
            const newWaitSteps = (currentRobotState.consecutiveWaitSteps || 0) + 1;
            this.simulationStateService.updateRobotState(robot.id, { consecutiveWaitSteps: newWaitSteps });

            if (newWaitSteps >= ROBOT_MAX_CONSECUTIVE_WAIT_STEPS_FOR_REPATH) { 
                console.log(`SIM_ENGINE_REPATH (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robot.id} waiting too long. Attempting re-path.`);
                this.handleRepathForWaitingRobot(robot.id);
            }
        }
    }
    return approvedToMove;
}

/**
 * 
 * @param approvedRobotIds  set of strings of robotId's that are approved to move
 * @returns nothing calls moveRobotOneStep function for every approved robot
 */
private executeApprovedMovements(approvedRobotIds: Set<string>): void {
    for (const robotId of approvedRobotIds) {
        moveRobotOneStep(robotId);
       
    }
}
/**
 * Attempts to re-calculate and assign a new path for a robot that is currently waiting.
 * 
 * This method is typically called when a robot is stuck or unable to proceed along its current path.
 * It first checks if the robot exists and has a target. If so, it tries to find a new path using
 * the pathfinding service. If a path is found, the robot's path and wait counter are updated.
 * If not, the robot is set to idle, and any assigned task is unassigned.
 *
 * @private
 * @param {string} robotId - The unique identifier of the robot to re-path.
 * 
 * @returns {void}
 *
 * @remarks
 * - If no robot or target is found, the robot is marked idle.
 * - If a new path is successfully found, the robot resumes movement toward the target.
 * - If pathfinding fails, the robot becomes idle, and the associated task is marked unassigned.
 */

private handleRepathForWaitingRobot(robotId: string): void {
    const robot = this.simulationStateService.getRobotById(robotId);
    const originalGrid = this.simulationStateService.getCurrentGrid(); 

    if (!robot || !robot.currentTarget || !originalGrid) {
        console.warn(`SIM_ENGINE_REPATH (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robotId} cannot re-path (no robot, target, or grid). Setting to idle.`);
        if (robotId) {
            this.simulationStateService.updateRobotState(robotId, {
                status: 'idle',
                currentPath: undefined,
                currentTarget: undefined,
                assignedTaskId: undefined,
                consecutiveWaitSteps: 0
            });
            if (robot && robot.status === 'onTaskWay' && robot.assignedTaskId) {
                this.simulationStateService.updateTaskState(robot.assignedTaskId, { status: 'unassigned' });
            }
        }
        return;
    }

    console.log(`SIM_ENGINE_REPATH (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robotId} attempting re-path from (${robot.currentLocation.x},${robot.currentLocation.y}) to target (${robot.currentTarget.x},${robot.currentTarget.y}).`);

   let problematicCellToBlockTemporarily: Coordinates | null = null;
if (robot.waitingBecauseOfRobotId) { // Assuming this info is passed or set
    const blockingRobot = this.simulationStateService.getRobotById(robot.waitingBecauseOfRobotId);
    if (blockingRobot) {
        problematicCellToBlockTemporarily = blockingRobot.currentLocation;
        console.log(`SIM_ENGINE_REPATH: Problematic cell for ${robot.id} is current location of ${blockingRobot.id}: (${problematicCellToBlockTemporarily.x},${problematicCellToBlockTemporarily.y})`);
    }
    robot.waitingBecauseOfRobotId = undefined; // Clear it
} else if(robot.currentPath && robot.currentPath.length > 0) {
        problematicCellToBlockTemporarily = robot.currentPath[0];
        console.log(`SIM_ENGINE_REPATH: Assuming problematic cell for ${robotId} is next step: (${problematicCellToBlockTemporarily.x},${problematicCellToBlockTemporarily.y})`);
    } else {
        console.log(`SIM_ENGINE_REPATH: Robot ${robotId} has no current path segment to identify a specific problematic cell. Trying standard re-path.`);
    }

   
    const tempGrid: Cell[][] = originalGrid.map(row =>
        row.map(cell => ({ ...cell, coordinates: { ...cell.coordinates } }))
    );

    
    if (problematicCellToBlockTemporarily) {
        const { x: probX, y: probY } = problematicCellToBlockTemporarily;
        if (probY >= 0 && probY < tempGrid.length &&
            probX >= 0 && probX < tempGrid[0].length) {

            if (!(probX === robot.currentLocation.x && probY === robot.currentLocation.y) &&
                !(probX === robot.currentTarget.x && probY === robot.currentTarget.y)) {
                console.log(`SIM_ENGINE_REPATH: Temporarily marking cell (${probX},${probY}) as 'wall' in temp grid for robot ${robotId}'s re-path.`);
                tempGrid[probY][probX] = { ...tempGrid[probY][probX], type: 'wall' };
            } else {
                 console.log(`SIM_ENGINE_REPATH: Problematic cell (${probX},${probY}) is robot's current location or target. Not blocking it for re-path.`);
            }
        } else {
            console.warn(`SIM_ENGINE_REPATH: Identified problematic cell (${probX},${probY}) is out of bounds for temp grid. Proceeding without temporary block.`);
        }
    }

    let newPath: Coordinates[] = [];
    try {
        const gridToUseForPathfinding = problematicCellToBlockTemporarily ? tempGrid : originalGrid;
        newPath = this.pathfindingService.findPath(
            gridToUseForPathfinding,
            robot.currentLocation,
            robot.currentTarget
        );
    } catch (e) {
        console.error(`SIM_ENGINE_REPATH (Tick ${this.simulationStateService.getSimulationTime()}): Error during pathfinding for ${robotId}:`, e);
        newPath = [];
    }

    if (newPath && newPath.length > 0) {
        let isIdenticalToOldPath = false;
        if (robot.currentPath && problematicCellToBlockTemporarily) { // Only checking identical if actually tried to block something
            if (newPath.length === robot.currentPath.length) {
                isIdenticalToOldPath = newPath.every((coord, index) =>
                    coord.x === robot.currentPath![index].x && coord.y === robot.currentPath![index].y
                );
            }
        }

        if (isIdenticalToOldPath) {
            console.warn(`SIM_ENGINE_REPATH (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robotId} re-path resulted in the SAME path despite temporary block. Setting to idle to break potential loop.`);
            this.setRobotToIdleAndUnassignTask(robotId, robot.status, robot.assignedTaskId);
        } else {
            console.log(`SIM_ENGINE_REPATH (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robotId} found a NEW path (length ${newPath.length}) to target (${robot.currentTarget.x},${robot.currentTarget.y}).`);
            this.simulationStateService.updateRobotState(robotId, {
                currentPath: newPath,
                consecutiveWaitSteps: 0,
            });
        }
    } else {
        console.warn(`SIM_ENGINE_REPATH (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robotId} failed to find ANY new path to target (${robot.currentTarget.x},${robot.currentTarget.y}). Setting to idle.`);
        this.setRobotToIdleAndUnassignTask(robotId, robot.status, robot.assignedTaskId);
    }
}

// Helper to avoid repetition for setting robot to idle and unassigning task
private setRobotToIdleAndUnassignTask(robotId: string, originalStatus?: string, assignedTaskId?: string): void {
    this.simulationStateService.updateRobotState(robotId, {
        status: 'idle',
        currentPath: undefined,
        currentTarget: undefined,
        assignedTaskId: undefined,
        consecutiveWaitSteps: 0,
    });
    if (originalStatus === 'onTaskWay' && assignedTaskId) {
        this.simulationStateService.updateTaskState(assignedTaskId, { status: 'unassigned' });
        console.log(`SIM_ENGINE_TASK_UNASSIGN (Tick ${this.simulationStateService.getSimulationTime()}): Task ${assignedTaskId} unassigned due to robot ${robotId} re-path failure/loop prevention.`);
    }
}
  
/**
 * this is called after every movement in step() method and controls robot status path and related things after movement
 * This method will now contain the big switch statement logic that was previously directly in  step() method's loop.
 *  It handles what robots do after movement decisions for the tick are made and executed (or if they didn't move).
 * and uses helper methods for every type of status of robot idle,ontaskway,onChargingway
 * calls handlers of al 3 types of status of robot 
 */
  private processAllRobotLogicAfterMovement(): void {
    const robots = this.simulationStateService.getRobots();
    for (const robot of robots) {
        const currentRobotState = this.simulationStateService.getRobotById(robot.id);
        if (!currentRobotState) continue;

        const isAtTarget = currentRobotState.currentTarget &&
            currentRobotState.currentLocation.x === currentRobotState.currentTarget.x &&
            currentRobotState.currentLocation.y === currentRobotState.currentTarget.y;

        if (isAtTarget && (currentRobotState.status === 'onTaskWay' || currentRobotState.status === 'onChargingWay') && (!currentRobotState.currentPath || currentRobotState.currentPath.length === 0) ) {
            if (currentRobotState.status === 'onTaskWay') {
                console.log(`SIM_ENGINE_ARRIVAL (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${currentRobotState.id} arrived at task.`);
                this.simulationStateService.updateRobotState(currentRobotState.id, {
                    status: 'performingTask', 
                    currentTarget: undefined,
                });
                const updatedRobotStateForTask = this.simulationStateService.getRobotById(robot.id)!;
                this.handlePerformingTaskLogic(updatedRobotStateForTask); 
                continue; 
            } else if (currentRobotState.status === 'onChargingWay') {
                console.log(`SIM_ENGINE_ARRIVAL (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${currentRobotState.id} arrived at charger.`);
                this.simulationStateService.updateRobotState(currentRobotState.id, {
                    status: 'charging',
                    currentTarget: undefined,
                });
                const updatedRobotStateForCharging = this.simulationStateService.getRobotById(robot.id)!;
                this.handleChargingLogic(updatedRobotStateForCharging); 
                continue; 
            }
        }
        switch (currentRobotState.status) {
            case 'performingTask':
                this.handlePerformingTaskLogic(currentRobotState);
                break;
            case 'charging':
                this.handleChargingLogic(currentRobotState);
                break;
            case 'idle':
                this.handleIdleLogic(currentRobotState);
                break;
            case 'onTaskWay': 
            case 'onChargingWay': 
                break;
        }
    }
}

/**
 * handles logic of performing task manages timer states for robot and task accordingly
 * @param robot robot that is currently performing task
 * @returns void
 */
private handlePerformingTaskLogic(robot: Robot): void {
    const task = this.simulationStateService.getTaskById(robot.assignedTaskId!);
    if (task && task.status !== 'completed') { 
        if (!robot.workProgress || robot.workProgress === 0) {
            const batteryAfterStartingTask = robot.battery - (task.batteryCostToPerform || 0);
            if (batteryAfterStartingTask < 0) {
                console.warn(`SIM_ENGINE (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robot.id} cannot perform task ${task.id}, insufficient battery. Setting idle.`);
                this.simulationStateService.updateRobotState(robot.id, { status: 'idle', assignedTaskId: undefined, workProgress: undefined });
                this.simulationStateService.updateTaskState(task.id, { status: 'unassigned' });
                return;
            }
            this.simulationStateService.updateRobotState(robot.id, { battery: batteryAfterStartingTask, workProgress: 1 });
        } else {
            this.simulationStateService.updateRobotState(robot.id, { workProgress: (robot.workProgress || 0) + 1 });
        }

        const currentRobotState = this.simulationStateService.getRobotById(robot.id)!;

        if ((currentRobotState.workProgress || 0) >= task.workDuration) {
            console.log(`SIM_ENGINE_TASK_DONE (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${currentRobotState.id} completed task ${task.id}.`);
            this.simulationStateService.updateTaskState(task.id, { status: 'completed' });
            this.simulationStateService.updateRobotState(currentRobotState.id, {
                status: 'idle',
                assignedTaskId: undefined,
                workProgress: undefined,
            });
        }
    } else if (task && task.status === 'completed' && robot.status === 'performingTask') {
        this.simulationStateService.updateRobotState(robot.id, { status: 'idle', assignedTaskId: undefined, workProgress: undefined });
    }
}

/**
 * CHARGING_DURATION_STEPS is defined in constants.ts
 * battery increase per step of charging
 * @param robot  robot that is currently charging called in ProcessAllRobotLogicAfterMovement
 */
private handleChargingLogic(robot: Robot): void {
    
    const batteryIncreasePerStep = robot.maxBattery / CHARGING_DURATION_STEPS; // Example logic
    const newBattery = Math.min(robot.battery + batteryIncreasePerStep, robot.maxBattery);

    this.simulationStateService.updateRobotState(robot.id, { battery: newBattery });

    if (newBattery >= robot.maxBattery) {
        this.simulationStateService.updateRobotState(robot.id, { status: 'idle' });
        console.log(`SIM_ENGINE_CHARGED (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robot.id} finished charging.`);
        this.rechargeCount++;
    }
}
/**
 * 
 * @param robot gets robot as parameter that is idle and completed just task or has not been assigned yet
 * if robot.battery is less than treshhold must go to charger othervise assign task
 * @returns void handles logic of idle robot repathing and reassigning tasks
 */
private handleIdleLogic(robot: Robot): void {
    if (robot.battery < LOW_BATTERY_THRESHOLD) { 
        const grid = this.simulationStateService.getCurrentGrid();
        if (!grid) return;
        const stations = this.simulationStateService.getChargingStations();
        if (stations.length === 0) {
            console.warn(`SIM_ENGINE (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robot.id} needs charge but no charging stations found.`);
            return;
        }

        let shortestPathToCharger: Coordinates[] | null = null;
        let bestChargerLocation: Coordinates | null = null;

        for (const station of stations) {
            const path = this.pathfindingService.findPath(grid, robot.currentLocation, station);
            if (path && path.length > 0 && (!shortestPathToCharger || path.length < shortestPathToCharger.length)) {
                shortestPathToCharger = path;
                bestChargerLocation = station;
            }
        }

        if (shortestPathToCharger && bestChargerLocation) {
            console.log(`SIM_ENGINE_TO_CHARGE (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robot.id} going to charge at ${bestChargerLocation.x},${bestChargerLocation.y}.`);
            this.simulationStateService.updateRobotState(robot.id, {
                status: 'onChargingWay',
                currentTarget: bestChargerLocation,
                currentPath: shortestPathToCharger
            });
        } else {
            console.warn(`SIM_ENGINE (Tick ${this.simulationStateService.getSimulationTime()}): Robot ${robot.id} needs charge but cannot find path to any station.`);
        }
    } else {
        this.taskAssignmentService.findAndAssignTaskForIdleRobot(robot.id);
    }
}
  
}

const simulationEngineService = new SimulationEngineService(simulationStateService, pathfindingService,taskAssignmentService);
export { simulationEngineService };
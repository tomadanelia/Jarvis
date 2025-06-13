import { simulationStateService, SimulationStateService } from "./simulationStateService";
import { PathfindingService, pathfindingService } from "./pathfindingService";
import { BASE_SIMULATION_STEP_INTERVAL_MS, DEFAULT_SIMULATION_SPEED_FACTOR, LOW_BATTERY_THRESHOLD } from "../config/constants";
import { moveRobotOneStep } from "./robotService";
import { Coordinates, Task } from "@common/types";
import { taskAssignmentService, TaskAssignmentService } from "./taskAssignmentService";
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
    if (this.simulationStateService.getSimulationStatus() !== 'running') {
        return;
    }

    this.simulationStateService.incrementSimulationTime();
    console.log(`SIM_ENGINE: --- Step ${this.simulationStateService.getSimulationTime()} ---`);

    for (const robot of this.simulationStateService.getRobots()) {
        let currentRobotState = this.simulationStateService.getRobotById(robot.id);
        if (!currentRobotState) continue; 
        if (currentRobotState.currentPath && currentRobotState.currentPath.length > 0) {
            moveRobotOneStep(currentRobotState.id);
            currentRobotState = this.simulationStateService.getRobotById(robot.id)!;
        }

        const isAtTarget = currentRobotState.currentTarget &&
            currentRobotState.currentTarget.x === currentRobotState.currentLocation.x &&
            currentRobotState.currentTarget.y === currentRobotState.currentLocation.y;

        switch (currentRobotState.status) {
            case 'onTaskWay':
                if (isAtTarget) {
                    console.log(`SIM_ENGINE: Robot ${currentRobotState.id} arrived at task.`);
                    const task = this.simulationStateService.getTaskById(currentRobotState.assignedTaskId!);
                    const newBattery = currentRobotState.battery - (task?.batteryCostToPerform || 0);
                    this.simulationStateService.updateRobotState(currentRobotState.id, {
                        status: 'performingTask',
                        battery: newBattery,
                        workProgress: 0, 
                        currentTarget: undefined, 
                        currentPath: undefined,
                    });
                }
                break;

            case 'performingTask':
                const task = this.simulationStateService.getTaskById(currentRobotState.assignedTaskId!);
                if (task) {
                    const newProgress = (currentRobotState.workProgress || 0) + 1;
                    this.simulationStateService.updateRobotState(currentRobotState.id, { workProgress: newProgress });

                    if (newProgress >= task.workDuration) {
                        console.log(`SIM_ENGINE: Robot ${currentRobotState.id} completed task ${task.id}.`);
                        this.simulationStateService.updateTaskState(task.id, { status: 'completed' });
                        this.simulationStateService.updateRobotState(currentRobotState.id, {
                            status: 'idle',
                            assignedTaskId: undefined,
                            workProgress: undefined,
                        });
                    }
                }
                break;

            case 'onChargingWay':
                if (isAtTarget) {
                    console.log(`SIM_ENGINE: Robot ${currentRobotState.id} arrived at charger.`);
                    this.simulationStateService.updateRobotState(currentRobotState.id, {
                        status: 'charging',
                        currentTarget: undefined,
                        currentPath: undefined,
                    });
                }
                break;

            case 'charging':
                const newBattery = currentRobotState.battery + 25;
                if (newBattery >= currentRobotState.maxBattery) {
                    this.simulationStateService.updateRobotState(currentRobotState.id, {
                        battery: currentRobotState.maxBattery,
                        status: 'idle'
                    });
                    console.log(`SIM_ENGINE: Robot ${currentRobotState.id} finished charging.`);
                } else {
                    this.simulationStateService.updateRobotState(currentRobotState.id, { battery: newBattery });
                }
                break;

            case 'idle':
                if (currentRobotState.battery < LOW_BATTERY_THRESHOLD) {
                    const grid = this.simulationStateService.getCurrentGrid()!;
                    const stations = this.simulationStateService.getChargingStations();
                    let shortestPath: Coordinates[] | null = null;

                    for (const station of stations) {
                        const path = this.pathfindingService.findPath(grid, currentRobotState.currentLocation, station);
                        if (path && path.length > 0 && (!shortestPath || path.length < shortestPath.length)) {
                            shortestPath = path;
                        }
                    }

                    if (shortestPath) {
                        this.simulationStateService.updateRobotState(currentRobotState.id, {
                            status: 'onChargingWay',
                            currentTarget: shortestPath[shortestPath.length - 1],
                            currentPath: shortestPath
                        });
                    }
                } else {
                    this.taskAssignmentService.findAndAssignTaskForIdleRobot(currentRobotState.id);
                }
                break;
        }
    } 

    const tasks = this.simulationStateService.getTasks();
    if (tasks.length > 0 && tasks.every(task => task.status === 'completed')) {
        this.endSimulation();
    }
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

    if (this.taskAssignmentService) {
      await this.taskAssignmentService.assignTasksOnInit();
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
  private endSimulation(): void {
        this.pauseSimulation();
        this.simulationStateService.setSimulationStatus('idle'); 
        // TODO: Calculate and save final metrics (using SupabaseService dependency)
        // TODO: Broadcast simulation_ended event (using WebSocketManager dependency)
        console.log('SIM_ENGINE: Simulation ended.');
    }

}
const simulationEngineService = new SimulationEngineService(simulationStateService, pathfindingService,taskAssignmentService);
export { simulationEngineService };
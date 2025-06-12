import { simulationStateService, SimulationStateService } from "./simulationStateService";
import { PathfindingService, pathfindingService } from "./pathfindingService";
import { BASE_SIMULATION_STEP_INTERVAL_MS, DEFAULT_SIMULATION_SPEED_FACTOR, LOW_BATTERY_THRESHOLD } from "src/config/constants";
import { moveRobotOneStep } from "./robotService";
import { Coordinates } from "@common/types";
/*Based on the TODO and the service roles, startSimulation() should:
Check if a grid is currently loaded in SimulationStateService. (You can't start a simulation without an environment).
Set the simulationStatus in SimulationStateService to 'running'.
Reset the simulationTime in SimulationStateService to 0. (The TODO implies resetSimulationSetup does this, but it's good to be explicit here too, or ensure resetSimulationSetup is called before start if that's the desired flow - the current plan implies resetSetup is a separate button/action). Let's assume startSimulation resets time.
Call the initial task assignment logic (e.g., taskAssignmentService.assignTasksOnInit()). This assigns the first batch of tasks based on the strategy.
Start the setInterval that will repeatedly call the engine's step() method.*/
class SimulationEngineService {
  private pathfindingService: PathfindingService;
  private simulationStateService: SimulationStateService;
  private taskAssignementService: any;  
  private intervalId: NodeJS.Timeout | null = null; // Store the interval ID
  private speedFactor: number = DEFAULT_SIMULATION_SPEED_FACTOR; // To control speed
  /**
   * Creates a new SimulationEngineService.
   * @param simulationStateService The simulation state service instance.
   * @param pathfindingService The pathfinding service instance.
   * @param taskAssignementService (Optional) The task assignment service instance.
   */
  public constructor(
    simulationStateService: SimulationStateService,
    pathfindingService: PathfindingService,
    taskAssignementService?: any
  ) {
    this.simulationStateService = simulationStateService;
    this.pathfindingService = pathfindingService;
    this.taskAssignementService = taskAssignementService;
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
      console.warn('SIM_ENGINE: Cannot step, simulation is not running.');
      return;
    }
    this.simulationStateService.incrementSimulationTime(); // Increment simulation time
    this.simulationStateService.getRobots().forEach(robot => {
      if (robot.currentPath&& robot.currentPath.length > 0) {
        if (!moveRobotOneStep(robot.id)) {
          return; // Skip further processing for this robot if it can't move
        }
        
      
      }
        const target=robot.currentTarget;
        if (!target) {
          console.warn(`SIM_ENGINE: Robot ${robot.id} has no current target.`);
          return;
        }
      if (robot.status==="idle"&&target.x=== robot.currentLocation.x && target.y === robot.currentLocation.y) {
        this.simulationStateService.updateRobotState(robot.id, { status: 'performingTask' });
        console.log(`SIM_ENGINE: Robot ${robot.id} is performing task at (${target.x}, ${target.y}).`);
      return;
      }
      if (robot.status === 'performingTask') {
        const task = this.simulationStateService.getTasks().find(t => t.id === robot.assignedTaskId);
        if (task) {
          if (robot.workProgress === undefined){
          robot.workProgress = 0;
        }   
          robot.workProgress+=1; 
          if (task.workDuration <= robot.workProgress) {
            this.simulationStateService.updateTaskState(task.id,{status: 'completed'});
            this.simulationStateService.updateRobotState(robot.id, { status: 'idle', assignedTaskId: undefined });
            this.taskAssignementService.findAndAssignTaskForIdleRobot(robot.id); // Reassign task if available
            robot.workProgress=0;
            console.log(`SIM_ENGINE: Robot ${robot.id} completed task ${task.id}.`);
          }
        } else {
          console.warn(`SIM_ENGINE: Task for robot ${robot.id} not found.`);
        }
      } else if (robot.status === 'charging') {
        robot.battery += 25; // Recharge battery
        if (robot.battery >= robot.maxBattery) {
          robot.battery = robot.maxBattery;
          this.simulationStateService.updateRobotState(robot.id, { status: 'idle' });
          console.log(`SIM_ENGINE: Robot ${robot.id} finished charging.`);
        }
      
    }
    else if (robot.status === 'idle') {
            // 3. IDLE ROBOT DECISION MAKING (Critical Missing Logic)
            // TODO:
          if (robot.battery < LOW_BATTERY_THRESHOLD) {

const grid = this.simulationStateService.getCurrentGrid();
const stations = this.simulationStateService.getChargingStations();
const arr= new Map<number,Coordinates[]>();
if (grid) {
  for (const c of stations) {
    let path= this.pathfindingService.findPath(grid, robot.currentLocation, c);
    let length = path.length;
    if (length > 0) {
        arr.set(length, path);
    }
}
let min = Math.min(...arr.keys());
const shortestPath = arr.get(min);
if (shortestPath) {
              this.simulationStateService.updateRobotState(robot.id, {
                status: 'onChargingWay',
                currentTarget: shortestPath[shortestPath.length - 1],
                currentPath: shortestPath
              });
              console.log(`SIM_ENGINE: Robot ${robot.id} is heading to charging station at (${shortestPath[shortestPath.length - 1].x}, ${shortestPath[shortestPath.length - 1].y}).`);
            } 
            } else {
              this.taskAssignementService.findAndAssignTaskForIdleRobot(robot.id); // Assign new task if available
             }
        }
  }
    }
    );
  
  const allTasksCompleted = this.simulationStateService.getTasks().every(task => task.status === 'completed');
         if (allTasksCompleted && this.simulationStateService.getSimulationStatus() === 'running') {
             console.log('SIM_ENGINE: All tasks completed. Ending simulation.');
             this.endSimulation(); // Call a method to handle cleanup/metrics
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

    if (this.taskAssignementService) {
      await this.taskAssignementService.assignTasksOnInit();
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
const simulationEngineService = new SimulationEngineService(simulationStateService, pathfindingService);
export { simulationEngineService };
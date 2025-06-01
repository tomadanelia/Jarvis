import { v4 as uuidv4 } from 'uuid';
import {
    Cell,
    Coordinates,
    Robot,
    Task,
    RobotStatus,
    TaskStatus,
    CellType, 
} from '@common/types'; 

import {
    DEFAULT_ROBOT_MAX_BATTERY,
    DEFAULT_MOVEMENT_COST_PER_CELL,
    INITIAL_CONSECUTIVE_WAIT_STEPS,
    DEFAULT_TASK_WORK_DURATION,
    DEFAULT_BATTERY_COST_TO_PERFORM_TASK,
    // Add any other relevant constants you might need
} from '../config/constants'; // Adjust path as needed

export type SimulationStrategy = 'nearest' | 'round-robin';
export type SimulationRunStatus = 'idle' | 'running' | 'paused';
/**
 * Manages the state of the simulation setup and active runtime.
 * This includes the grid, robots, tasks, selected strategy, and simulation progress.
 */
export class SimulationStateService {
    private currentGrid: Cell[][] | null = null;
    private currentGridId: string | null = null;
    private currentGridName: string | null = null;

    private robots: Robot[] = [];
    private tasks: Task[] = [];

    private selectedStrategy: SimulationStrategy | null = null;
    private simulationStatus: SimulationRunStatus = 'idle';
    private simulationTime: number = 0; 
/**
 * Initializes a new simulation environment with a specific grid.
 * Clears any existing robots and tasks. Resets simulation time and status.
 * @param gridId - The unique identifier of the grid to load.
 * @param gridName - The display name of the grid.
 * @param gridLayout - The 2D array of Cell objects representing the grid structure.
 */
    public initializeSimulation(gridId: string, gridName: string, gridLayout: Cell[][]): void {
        console.log(`Initializing simulation with grid: ${gridName} (ID: ${gridId})`);
        this.currentGrid = gridLayout;
        this.currentGridId = gridId;
        this.currentGridName = gridName;
        this.robots = []; 
        this.tasks = [];  
        this.selectedStrategy = null; // Or keep current strategy? Decide on behavior. Let's reset it.
        this.simulationStatus = 'idle';
        this.simulationTime = 0;
    }

    public getCurrentGrid(): Cell[][] | null {
        return this.currentGrid;
    }

    public getCurrentGridId(): string | null {
        return this.currentGridId;
    }

    public getCurrentGridName(): string | null {
        return this.currentGridName;
    }
/**
 * Adds a new robot to the simulation at the specified location.
 * Robots can be placed on 'walkable' or 'charging_station' cells.
 * @param location - The coordinates where the robot should be placed.
 * @param iconType - The string identifier for the robot's visual icon.
 * @returns The newly created Robot object, or null if placement is invalid or simulation is active.
 */
    public addRobot(location: Coordinates, iconType: string): Robot | null {
        if (!this.currentGrid) {
            console.warn("SIM_STATE_SERVICE: Cannot add robot, no grid loaded.");
            return null;
        }
        if (!this._isValidPlacement(location, true)) { // true allows placement on charging_station
            console.warn(`SIM_STATE_SERVICE: Invalid placement for robot at (${location.x}, ${location.y}).`);
            return null;
        }

        const newRobot: Robot = {
            id: uuidv4(),
            iconType: iconType,
            currentLocation: { ...location },
            initialLocation:{...location},
            battery: DEFAULT_ROBOT_MAX_BATTERY,
            maxBattery: DEFAULT_ROBOT_MAX_BATTERY,
            status: 'idle',
            assignedTaskId: undefined,
            currentTarget: undefined,
            currentPath: undefined,
            movementCostPerCell: DEFAULT_MOVEMENT_COST_PER_CELL,
            consecutiveWaitSteps: INITIAL_CONSECUTIVE_WAIT_STEPS,
        };
        this.robots.push(newRobot);
        console.log(`SIM_STATE_SERVICE: Robot ${newRobot.id} added at (${location.x}, ${location.y})`);
        return newRobot;
    }

    public getRobots(): Robot[] {
        return [...this.robots]; 
    }

    public getRobotById(robotId: string): Robot | undefined {
        return this.robots.find(r => r.id === robotId);
    }


public deleteRobot(id: string): boolean {
    const index = this.robots.findIndex(roboti => roboti.id === id);
    if (index !== -1) {
        this.robots.splice(index, 1);
        return true;
    }
    return false;
} 
public deleteTask(id: string): boolean {
    const index = this.tasks.findIndex(task => task.id === id); 
    if (index !== -1) {
        this.tasks.splice(index, 1);
        return true;
    }
    return false;
}
    public updateRobotState(robotId: string, updates: Partial<Omit<Robot, 'id'>>): Robot | null {
        const robot = this.getRobotById(robotId);
        if (!robot) {
            console.warn(`SIM_STATE_SERVICE: Robot with ID ${robotId} not found for update.`);
            return null;
        }
        const { id, ...restOfUpdates } = updates as any; 
        Object.assign(robot, restOfUpdates);
        return robot;
    }
    
    public addTask(location: Coordinates): Task | null {
        if (!this.currentGrid) {
            console.warn("SIM_STATE_SERVICE: Cannot add task, no grid loaded.");
            return null;
        }
        if (!this._isValidPlacement(location, false)) { // true allows placement on charging_station
            console.warn(`SIM_STATE_SERVICE: Invalid placement for robot at (${location.x}, ${location.y}).`);
            return null;
        }
    const newTask:Task={
     id: uuidv4(),
    location:{...location},
    status:"unassigned",
    workDuration:DEFAULT_TASK_WORK_DURATION,
    batteryCostToPerform:DEFAULT_BATTERY_COST_TO_PERFORM_TASK,
    }
    this.tasks.push(newTask);
       return newTask;
    }
    

    public getTasks(): Task[] {
        return [...this.tasks]; 
    }

    public getTaskById(taskId: string): Task | undefined {
        return this.tasks.find(t => t.id === taskId);
    }

    public updateTaskState(taskId: string, updates: Partial<Omit<Task, 'id'>>): Task | null {
        const task = this.getTaskById(taskId);
        if (!task) {
            console.warn(`SIM_STATE_SERVICE: Task with ID ${taskId} not found for update.`);
            return null;
        }
        const { id, ...restOfUpdates } = updates as any;
        Object.assign(task, restOfUpdates);
        return task;
    }

    public setStrategy(strategy: SimulationStrategy): void {
        this.selectedStrategy = strategy;
        console.log(`SIM_STATE_SERVICE: Strategy set to ${strategy}`);
    }

    public getSelectedStrategy(): SimulationStrategy | null {
        return this.selectedStrategy;
    }

    public setSimulationStatus(status: SimulationRunStatus): void {
        this.simulationStatus = status;
        console.log(`SIM_STATE_SERVICE: Simulation status set to ${status}`);
    }

    public getSimulationStatus(): SimulationRunStatus {
        return this.simulationStatus;
    }

    public incrementSimulationTime(): void {
        this.simulationTime++;
    }

    public resetSimulationTime(): void {
        this.simulationTime = 0;
    }

    public getSimulationTime(): number {
        return this.simulationTime;
    }

    // --- Simulation Reset ---
    public resetSimulationSetup(): void {
        console.log("SIM_STATE_SERVICE: Resetting simulation setup.");
        this.robots.forEach(robot => {
            
            robot.currentLocation=robot.initialLocation;
            robot.battery = robot.maxBattery; // Full battery
            robot.status = 'idle';
            robot.assignedTaskId = undefined;
            robot.currentTarget = undefined;
            robot.currentPath = undefined;
            robot.consecutiveWaitSteps = INITIAL_CONSECUTIVE_WAIT_STEPS;
        });

        this.tasks.forEach(task => {
            task.status = 'unassigned';
        });

        this.simulationStatus = 'idle';
        this.simulationTime = 0;
        console.log("SIM_STATE_SERVICE: Robots and tasks reset to initial states.");
    }

    /**
     * Validates if a given location is a valid placement spot on the current grid.
     * @param location The coordinates to check.
     * @param allowOnChargerStation If true, placement on 'charging_station' is allowed.
     *                               Otherwise, only 'walkable' is allowed.
     * @returns boolean True if valid placement, false otherwise.
     */
    public _isValidPlacement(location: Coordinates, allowOnChargerStation: boolean = false): boolean {
        if (!this.currentGrid) {
            return false;  
        }
        const { x, y } = location;
//actually there no difference this.currentGrid[y] or this.currentGrid[0] all are same size
        if (y < 0 || y >= this.currentGrid.length || !this.currentGrid[y] || x < 0 || x >= this.currentGrid[y].length) {
            console.warn(`SIM_STATE_SERVICE: Placement out of bounds at (${x}, ${y}).`);
            return false;
        }

        const cell: Cell | undefined = this.currentGrid[y][x];
        if (!cell) {
            console.warn(`SIM_STATE_SERVICE: No cell data at (${x}, ${y}) - grid might be improperly formed.`);
            return false; 
        }

        const targetCellType = cell.type;

        if (targetCellType === 'walkable') {
            return true;
        }
        if (allowOnChargerStation && targetCellType === 'chargingStation') {
            return true;
        }

        console.warn(`SIM_STATE_SERVICE: Cannot place on cell type '${targetCellType}' at (${x}, ${y}) with allowOnChargerStation=${allowOnChargerStation}.`);
        return false;
    }
}
// packages/backend/src/services/taskAssignmentService.ts

import { Coordinates, Robot, Task } from '@common/types';
import { PathfindingService, pathfindingService } from './pathfindingService';
import { SimulationStateService, simulationStateService } from './simulationStateService';

export class TaskAssignmentService {
    private simulationStateService: SimulationStateService;
    private pathfindingService: PathfindingService;
    private nextRobotIndexForRoundRobin = 0;

    /**
     * Creates an instance of TaskAssignmentService.
     * @param simulationStateService The service for managing simulation state.
     * @param pathfindingService The service for finding paths on the grid.
     */
    constructor(
        simulationStateService: SimulationStateService,
        pathfindingService: PathfindingService
    ) {
        this.simulationStateService = simulationStateService;
        this.pathfindingService = pathfindingService;
    }

    /**
     * Assigns initial tasks to robots at the start of the simulation based on the selected strategy.
     */
    public assignTasksOnInit(): void {
        const strategy = this.simulationStateService.getSelectedStrategy();
        this.nextRobotIndexForRoundRobin = 0;

        console.log(`TASK_ASSIGNMENT_SERVICE: Initializing tasks with strategy: ${strategy}`);

        if (strategy === 'nearest') {
            // --- FIX: Only consider 'worker' robots that are idle ---
            const idleWorkerRobots = this.simulationStateService.getRobots().filter(
                r => r.status === 'idle' && r.type === 'worker'
            );
            for (const robot of idleWorkerRobots) {
                this.findAndAssignTaskForIdleRobot(robot.id);
            }
        } else if (strategy === 'round-robin') {
            const unassignedTasks = this.simulationStateService.getTasks().filter(t => t.status === 'unassigned');
            // --- FIX: Only consider 'worker' robots for the cycle ---
            const workerRobots = this.simulationStateService.getRobots().filter(r => r.type === 'worker');

            if (workerRobots.length === 0) {
                console.warn("TASK_ASSIGNMENT_SERVICE: No worker robots to assign tasks to for round-robin init.");
                return;
            }

            for (const task of unassignedTasks) {
                for (let i = 0; i < workerRobots.length; i++) {
                    const robot = workerRobots[this.nextRobotIndexForRoundRobin];
                    const currentRobotState = this.simulationStateService.getRobotById(robot.id);

                    if (currentRobotState?.status === 'idle') {
                        this.assignTaskToRobot(task, currentRobotState);
                        this.nextRobotIndexForRoundRobin = (this.nextRobotIndexForRoundRobin + 1) % workerRobots.length;
                        break; 
                    }
                    
                    this.nextRobotIndexForRoundRobin = (this.nextRobotIndexForRoundRobin + 1) % workerRobots.length;
                }
            }
        }
    }

    /**
     * Finds and assigns a task to a specific idle robot based on the current strategy.
     * This is typically called when a robot finishes a task or charging.
     * @param robotId The ID of the idle robot.
     */
    public findAndAssignTaskForIdleRobot(robotId: string): void {
        const robot = this.simulationStateService.getRobotById(robotId);
        
        // --- FIX: Add a guard clause to immediately ignore non-worker robots ---
        if (!robot || robot.status !== 'idle' || robot.type !== 'worker') {
            return;
        }

        const strategy = this.simulationStateService.getSelectedStrategy();

        if (strategy === 'nearest') {
            this.assignNearestTask(robot);
        } else if (strategy === 'round-robin') {
            // --- FIX: Only consider 'worker' robots for the cycle ---
            const workerRobots = this.simulationStateService.getRobots().filter(r => r.type === 'worker');
            const unassignedTasks = this.simulationStateService.getTasks().filter(t => t.status === 'unassigned');

            if (unassignedTasks.length === 0 || workerRobots.length === 0) {
                return;
            }

            const nextRobotInSequence = workerRobots[this.nextRobotIndexForRoundRobin];
            if (robot.id === nextRobotInSequence.id) {
                const taskToAssign = unassignedTasks[0];
                this.assignTaskToRobot(taskToAssign, robot);
                this.nextRobotIndexForRoundRobin = (this.nextRobotIndexForRoundRobin + 1) % workerRobots.length;
            }
        }
    }

    /**
     * Finds the closest, feasible task and assigns it to the given robot.
     * @param robot The robot to assign a task to.
     */
    private assignNearestTask(robot: Robot): void {
        // --- FIX: Add a guard clause here as well for safety ---
        if (robot.type !== 'worker') {
            return;
        }

        const grid = this.simulationStateService.getCurrentGrid();
        if (!grid) return;

        const unassignedTasks = this.simulationStateService.getTasks().filter(t => t.status === 'unassigned');
        if (unassignedTasks.length === 0) return;

        let bestTask: Task | null = null;
        let shortestPath: Coordinates[] | null = null;

        for (const task of unassignedTasks) {
            const path = this.pathfindingService.findPath(grid, robot.currentLocation, task.location);
            if (path.length > 0) {
                const travelCost = (path.length - 1) * robot.movementCostPerCell;
                if (robot.battery > travelCost + task.batteryCostToPerform) {
                    if (!shortestPath || path.length < shortestPath.length) {
                        shortestPath = path;
                        bestTask = task;
                    }
                }
            }
        }

        if (bestTask && shortestPath) {
            this.assignTaskToRobot(bestTask, robot, shortestPath);
        }
    }

    /**
     * Centralized method to apply the state changes for a task assignment.
     * @param task The task to be assigned.
     * @param robot The robot to assign the task to.
     * @param path Optional pre-calculated path. If not provided, it will be calculated.
     */
    private assignTaskToRobot(task: Task, robot: Robot, path?: Coordinates[]): void {
        const grid = this.simulationStateService.getCurrentGrid();
        if (!grid) return;

        const finalPath = path || this.pathfindingService.findPath(grid, robot.currentLocation, task.location);

        if (!finalPath || finalPath.length === 0) {
            console.warn(`TASK_ASSIGNMENT_SERVICE: No path found for Robot ${robot.id} to Task ${task.id}. Assignment failed.`);
            return;
        }
        
        const travelCost = (finalPath.length - 1) * robot.movementCostPerCell;
        if (robot.battery <= travelCost + task.batteryCostToPerform) {
            console.warn(`TASK_ASSIGNMENT_SERVICE: Insufficient battery for Robot ${robot.id} to complete Task ${task.id}. Assignment failed.`);
            return;
        }

        console.log(`TASK_ASSIGNMENT_SERVICE: Assigning Task ${task.id} to Robot ${robot.id}. Path length: ${finalPath.length}`);
        
        this.simulationStateService.updateRobotState(robot.id, {
            status: 'onTaskWay',
            assignedTaskId: task.id,
            currentTarget: task.location,
            currentPath: finalPath,
        });

        this.simulationStateService.updateTaskState(task.id, {
            status: 'assigned',
        });
    }
}

// Export a singleton instance to be used by other services
const taskAssignmentService = new TaskAssignmentService(simulationStateService, pathfindingService);
export { taskAssignmentService };
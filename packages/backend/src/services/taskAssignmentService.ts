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
        this.nextRobotIndexForRoundRobin = 0; // Reset index for every new simulation start

        console.log(`TASK_ASSIGNMENT_SERVICE: Initializing tasks with strategy: ${strategy}`);

        if (strategy === 'nearest') {
            const idleRobots = this.simulationStateService.getRobots().filter(r => r.status === 'idle');
            for (const robot of idleRobots) {
                this.findAndAssignTaskForIdleRobot(robot.id);
            }
        } else if (strategy === 'round-robin') {
            const unassignedTasks = this.simulationStateService.getTasks().filter(t => t.status === 'unassigned');
            const allRobots = this.simulationStateService.getRobots();

            if (allRobots.length === 0) {
                console.warn("TASK_ASSIGNMENT_SERVICE: No robots to assign tasks to for round-robin init.");
                return;
            }

            for (const task of unassignedTasks) {
                // Try to assign this task by cycling through all robots starting from the next in sequence
                for (let i = 0; i < allRobots.length; i++) {
                    const robot = allRobots[this.nextRobotIndexForRoundRobin];
                    const currentRobotState = this.simulationStateService.getRobotById(robot.id);

                    // A robot is available if it's idle
                    if (currentRobotState?.status === 'idle') {
                        this.assignTaskToRobot(task, currentRobotState);
                        // Advance index for the next task
                        this.nextRobotIndexForRoundRobin = (this.nextRobotIndexForRoundRobin + 1) % allRobots.length;
                        break; // Task assigned, move to the next task
                    }
                    
                    // If robot is not idle, try the next one for the same task
                    this.nextRobotIndexForRoundRobin = (this.nextRobotIndexForRoundRobin + 1) % allRobots.length;
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
        if (!robot || robot.status !== 'idle') {
            return; // Not an idle robot or doesn't exist.
        }

        const strategy = this.simulationStateService.getSelectedStrategy();

        if (strategy === 'nearest') {
            this.assignNearestTask(robot);
        } else if (strategy === 'round-robin') {
            const allRobots = this.simulationStateService.getRobots();
            const unassignedTasks = this.simulationStateService.getTasks().filter(t => t.status === 'unassigned');

            if (unassignedTasks.length === 0 || allRobots.length === 0) {
                return;
            }

            // Check if it's the current robot's turn in the sequence
            const nextRobotInSequence = allRobots[this.nextRobotIndexForRoundRobin];
            if (robot.id === nextRobotInSequence.id) {
                const taskToAssign = unassignedTasks[0]; // Oldest unassigned task
                this.assignTaskToRobot(taskToAssign, robot);
                // Advance the index only after a successful assignment
                this.nextRobotIndexForRoundRobin = (this.nextRobotIndexForRoundRobin + 1) % allRobots.length;
            }
        }
    }

    /**
     * Finds the closest, feasible task and assigns it to the given robot.
     * @param robot The robot to assign a task to.
     */
    private assignNearestTask(robot: Robot): void {
        const grid = this.simulationStateService.getCurrentGrid();
        if (!grid) return;

        const unassignedTasks = this.simulationStateService.getTasks().filter(t => t.status === 'unassigned');
        if (unassignedTasks.length === 0) return;

        let bestTask: Task | null = null;
        let shortestPath: Coordinates[] | null = null;

        for (const task of unassignedTasks) {
            const path = this.pathfindingService.findPath(grid, robot.currentLocation, task.location);
            if (path.length > 0) { // Path must exist
                const travelCost = (path.length - 1) * robot.movementCostPerCell;
                if (robot.battery > travelCost + task.batteryCostToPerform) { // Must have enough battery
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
// packages/backend/src/services/taskAssignmentService.ts

import { Coordinates, Robot, Task } from '@common/types';
import { PathfindingService, pathfindingService } from './pathfindingService';
import { SimulationStateService, simulationStateService } from './simulationStateService';
import { diff } from 'util';

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
    const idleWorkerRobots = this.simulationStateService.getRobots().filter(
        r => r.status === 'idle' && r.type === 'worker'
    );
    const tasks = this.simulationStateService.getTasks().filter(t => t.status === 'unassigned');
    const grid = this.simulationStateService.getCurrentGrid();
    if (!grid || idleWorkerRobots.length === 0 || tasks.length === 0) return;

    const robotNumber = idleWorkerRobots.length;
    const taskNumber = tasks.length;
    const size = Math.max(robotNumber, taskNumber);

    let costMatrix: number[][] = Array.from({ length: size }, () => Array(size).fill(3000));

    for (let i = 0; i < robotNumber; i++) {
        for (let j = 0; j < taskNumber; j++) {
            const robot = idleWorkerRobots[i];
            const task = tasks[j];
            const path = this.pathfindingService.findPath(grid, robot.currentLocation, task.location);
            costMatrix[i][j] = path.length;
        }
    }

    // Step 1: Row Reduction
    for (let i = 0; i < size; i++) {
        const min = Math.min(...costMatrix[i]);
        for (let j = 0; j < size; j++) {
            costMatrix[i][j] -= min;
        }
    }

    // Step 2: Column Reduction
    for (let j = 0; j < size; j++) {
        let colMin = Infinity;
        for (let i = 0; i < size; i++) {
            colMin = Math.min(colMin, costMatrix[i][j]);
        }
        for (let i = 0; i < size; i++) {
            costMatrix[i][j] -= colMin;
        }
    }

    // Helper matrices
    const starred = Array.from({ length: size }, () => Array(size).fill(false));
    const primed = Array.from({ length: size }, () => Array(size).fill(false));
    const coveredRows = Array(size).fill(false);
    const coveredCols = Array(size).fill(false);

    // Step 3: Star zeros
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (costMatrix[i][j] === 0 && !coveredRows[i] && !coveredCols[j]) {
                starred[i][j] = true;
                coveredRows[i] = true;
                coveredCols[j] = true;
            }
        }
    }
    coveredRows.fill(false);
    coveredCols.fill(false);

    // Step 4+: Cover columns with stars and reduce
    const coverColumnsWithStars = () => {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (starred[i][j]) coveredCols[j] = true;
            }
        }
    };

    const findMinimumUncovered = () => {
        let min = Infinity;
        for (let i = 0; i < size; i++) {
            if (!coveredRows[i]) {
                for (let j = 0; j < size; j++) {
                    if (!coveredCols[j]) min = Math.min(min, costMatrix[i][j]);
                }
            }
        }
        return min;
    };

    const adjustMatrix = () => {
        const min = findMinimumUncovered();
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (!coveredRows[i] && !coveredCols[j]) costMatrix[i][j] -= min;
                if (coveredRows[i] && coveredCols[j]) costMatrix[i][j] += min;
            }
        }
    };

    const findZeroAndPrime = () => {
        for (let i = 0; i < size; i++) {
            if (!coveredRows[i]) {
                for (let j = 0; j < size; j++) {
                    if (costMatrix[i][j] === 0 && !coveredCols[j]) {
                        primed[i][j] = true;
                        const starCol = starred[i].indexOf(true);
                        if (starCol === -1) return { row: i, col: j };
                        coveredRows[i] = true;
                        coveredCols[starCol] = false;
                        return null;
                    }
                }
            }
        }
        return null;
    };

    const augmentPath = (start: { row: number, col: number }) => {
        const path = [start];
        while (true) {
            const row = path[path.length - 1].row;
            const col = path[path.length - 1].col;
            let nextRow = -1, nextCol = -1;
            for (let i = 0; i < size; i++) {
                if (starred[i][col]) {
                    nextRow = i;
                    break;
                }
            }
            if (nextRow === -1) break;
            path.push({ row: nextRow, col });
            for (let j = 0; j < size; j++) {
                if (primed[nextRow][j]) {
                    nextCol = j;
                    break;
                }
            }
            path.push({ row: nextRow, col: nextCol });
        }

        for (const p of path) {
            starred[p.row][p.col] = !starred[p.row][p.col];
        }
        primed.forEach(row => row.fill(false));
        coveredRows.fill(false);
        coveredCols.fill(false);
    };

    while (true) {
        coverColumnsWithStars();
        const coveredCount = coveredCols.filter(Boolean).length;
        if (coveredCount === size) break;

        let next;
        while (!(next = findZeroAndPrime())) {
            adjustMatrix();
        }
        augmentPath(next);
    }

    // Extract assignments and apply
    for (let i = 0; i < robotNumber; i++) {
        for (let j = 0; j < taskNumber; j++) {
            if (starred[i][j]) {
                const robot = idleWorkerRobots[i];
                const task = tasks[j];
                this.assignTaskToRobot(task, robot);
            }
        }
    }
} else if (strategy === 'round-robin') {
    const unassignedTasks = this.simulationStateService.getTasks().filter(t => t.status === 'unassigned');
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
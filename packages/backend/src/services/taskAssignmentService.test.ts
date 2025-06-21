// packages/backend/src/services/taskAssignmentService.test.ts

import { TaskAssignmentService } from './taskAssignmentService';
import { SimulationStateService } from './simulationStateService';
import { PathfindingService } from './pathfindingService';
import { Robot, Task, Cell, Coordinates } from '@common/types';

// Mock the dependent services
jest.mock('./simulationStateService');
jest.mock('./pathfindingService');

describe('TaskAssignmentService', () => {
    let mockSimStateService: jest.Mocked<SimulationStateService>;
    let mockPathfindingService: jest.Mocked<PathfindingService>;
    let taskAssignmentService: TaskAssignmentService;

    // Helper to create a mock robot
    const createMockRobot = (id: string, status: Robot['status'] = 'idle', battery = 100, location: Coordinates = { x: 0, y: 0 }): Robot => ({
        id,
        status,
        battery,
        currentLocation: location,
        movementCostPerCell: 1, // Default cost
        // other properties are not essential for these tests but can be added
    } as Robot);

    // Helper to create a mock task
    const createMockTask = (id: string, status: Task['status'] = 'unassigned', location: Coordinates = { x: 1, y: 1 }): Task => ({
        id,
        status,
        location,
        batteryCostToPerform: 5,
    } as Task);

    beforeEach(() => {
        // Create new mock instances for each test
        mockSimStateService = new SimulationStateService() as jest.Mocked<SimulationStateService>;
        mockPathfindingService = new PathfindingService() as jest.Mocked<PathfindingService>;
        
        // Instantiate the service with the mocks
        taskAssignmentService = new TaskAssignmentService(mockSimStateService, mockPathfindingService);

        // Mock a generic grid for pathfinding
        mockSimStateService.getCurrentGrid.mockReturnValue([[]] as Cell[][]); 
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('assignNearestTask (via findAndAssignTaskForIdleRobot)', () => {
        beforeEach(() => {
            mockSimStateService.getSelectedStrategy.mockReturnValue('nearest');
        });

        test('should assign the closest task to an idle robot', () => {
            const robot = createMockRobot('robot-1');
            const task1 = createMockTask('task-1', 'unassigned', { x: 5, y: 5 }); // further
            const task2 = createMockTask('task-2', 'unassigned', { x: 2, y: 2 }); // closer

            mockSimStateService.getRobotById.mockReturnValue(robot);
            mockSimStateService.getTasks.mockReturnValue([task1, task2]);
            
            // Mock pathfinder to return different path lengths
            const path1 = [{x:0,y:0}, {x:1,y:1}, {x:2,y:2}, {x:3,y:3}, {x:4,y:4}, {x:5,y:5}]; // path to task1 (length 6)
            const path2 = [{x:0,y:0}, {x:1,y:1}, {x:2,y:2}]; // path to task2 (length 3)
            mockPathfindingService.findPath
                .mockImplementation((grid, start, end) => end.x === 5 ? path1 : path2);

            taskAssignmentService.findAndAssignTaskForIdleRobot('robot-1');

            // It should have assigned the closer task (task-2)
            expect(mockSimStateService.updateRobotState).toHaveBeenCalledWith('robot-1', {
                status: 'onTaskWay',
                assignedTaskId: 'task-2',
                currentTarget: task2.location,
                currentPath: path2,
            });
            expect(mockSimStateService.updateTaskState).toHaveBeenCalledWith('task-2', { status: 'assigned' });
        });

        test('should not assign a task if robot battery is insufficient', () => {
            // Total cost = travel cost + performance cost
            // Travel cost = (path length - 1) * movementCostPerCell
            const robot = createMockRobot('robot-1', 'idle', 10); // Low battery
            const task = createMockTask('task-1', 'unassigned', { x: 2, y: 2 });
            task.batteryCostToPerform = 5;
            robot.movementCostPerCell = 3; // travel cost = (3-1)*3 = 6. Total cost = 6 + 5 = 11. Robot only has 10.
            
            mockSimStateService.getRobotById.mockReturnValue(robot);
            mockSimStateService.getTasks.mockReturnValue([task]);
            
            const path = [{x:0,y:0}, {x:1,y:1}, {x:2,y:2}];
            mockPathfindingService.findPath.mockReturnValue(path);
            
            taskAssignmentService.findAndAssignTaskForIdleRobot('robot-1');

            // No assignment should be made
            expect(mockSimStateService.updateRobotState).not.toHaveBeenCalled();
            expect(mockSimStateService.updateTaskState).not.toHaveBeenCalled();
        });

        test('should not assign a task if no path is found', () => {
            const robot = createMockRobot('robot-1');
            const task = createMockTask('task-1');
            mockSimStateService.getRobotById.mockReturnValue(robot);
            mockSimStateService.getTasks.mockReturnValue([task]);
            
            mockPathfindingService.findPath.mockReturnValue([]); // No path

            taskAssignmentService.findAndAssignTaskForIdleRobot('robot-1');

            expect(mockSimStateService.updateRobotState).not.toHaveBeenCalled();
        });
    });

    describe('assignTasksOnInit (round-robin)', () => {
        beforeEach(() => {
            mockSimStateService.getSelectedStrategy.mockReturnValue('round-robin');
        });

        test('should assign tasks to idle robots in order', () => {
            const robot1 = createMockRobot('robot-1');
            const robot2 = createMockRobot('robot-2', 'onTaskWay'); // Not idle
            const robot3 = createMockRobot('robot-3');
            const task1 = createMockTask('task-1');
            const task2 = createMockTask('task-2');

            mockSimStateService.getRobots.mockReturnValue([robot1, robot2, robot3]);
            mockSimStateService.getRobotById.mockImplementation(id => {
                if (id === 'robot-1') return robot1;
                if (id === 'robot-2') return robot2;
                if (id === 'robot-3') return robot3;
                return undefined;
            });
            mockSimStateService.getTasks.mockReturnValue([task1, task2]);
            mockPathfindingService.findPath.mockReturnValue([{x:0,y:0}]); // Any valid path

            // Simulate the state updates that happen during assignment
            mockSimStateService.updateRobotState.mockImplementation((robotId, updates) => {
                if (robotId === 'robot-1') robot1.status = updates.status || robot1.status;
                if (robotId === 'robot-3') robot3.status = updates.status || robot3.status;
                return {} as Robot;
            });
            
            taskAssignmentService.assignTasksOnInit();

            // Task 1 -> Robot 1
            expect(mockSimStateService.updateRobotState).toHaveBeenCalledWith('robot-1', expect.objectContaining({ assignedTaskId: 'task-1' }));
            
            // Task 2 skips robot 2 (not idle) and goes to Robot 3
            expect(mockSimStateService.updateRobotState).toHaveBeenCalledWith('robot-3', expect.objectContaining({ assignedTaskId: 'task-2' }));
            
            expect(mockSimStateService.updateRobotState).toHaveBeenCalledTimes(2);
        });
    });

    describe('findAndAssignTaskForIdleRobot (round-robin)', () => {
        beforeEach(() => {
            mockSimStateService.getSelectedStrategy.mockReturnValue('round-robin');
        });

        test('should assign a task only if it is the robot\'s turn', () => {
            const robot1 = createMockRobot('robot-1');
            const robot2 = createMockRobot('robot-2');
            const task1 = createMockTask('task-1');

            mockSimStateService.getRobots.mockReturnValue([robot1, robot2]);
            mockSimStateService.getTasks.mockReturnValue([task1]);
            mockPathfindingService.findPath.mockReturnValue([{x:0,y:0}]);

            // It's robot-1's turn initially (index 0)
            mockSimStateService.getRobotById.mockReturnValue(robot1);
            taskAssignmentService.findAndAssignTaskForIdleRobot('robot-1');
            expect(mockSimStateService.updateRobotState).toHaveBeenCalledTimes(1);
            expect(mockSimStateService.updateRobotState).toHaveBeenCalledWith('robot-1', expect.objectContaining({ assignedTaskId: 'task-1' }));
            
            // It is now robot-2's turn. Calling for robot-1 again should do nothing.
            mockSimStateService.getRobotById.mockReturnValue(robot1);
            taskAssignmentService.findAndAssignTaskForIdleRobot('robot-1');
            // The call count should still be 1 from the previous step.
            expect(mockSimStateService.updateRobotState).toHaveBeenCalledTimes(1);

            // Now call for robot-2, it is its turn
            mockSimStateService.getRobotById.mockReturnValue(robot2);
            mockSimStateService.getTasks.mockReturnValue([createMockTask('task-2', 'unassigned')]); // provide a new task
            taskAssignmentService.findAndAssignTaskForIdleRobot('robot-2');
            expect(mockSimStateService.updateRobotState).toHaveBeenCalledTimes(2);
            expect(mockSimStateService.updateRobotState).toHaveBeenCalledWith('robot-2', expect.objectContaining({ assignedTaskId: 'task-2' }));
        });
    });
});
import { SimulationEngineService } from './simulationEngineService';
import { SimulationStateService } from './simulationStateService';
import { PathfindingService } from './pathfindingService';
import { TaskAssignmentService } from './taskAssignmentService';
import { Cell } from '@common/types';
import { BASE_SIMULATION_STEP_INTERVAL_MS } from '../config/constants';

jest.mock('./simulationStateService');
jest.mock('./pathfindingService');
jest.mock('./taskAssignmentService');

jest.useFakeTimers();
/**
 * Test suite for SimulationEngineService.startSimulation method.
 * This suite tests various scenarios including:
 * 1. Starting the simulation when no grid is loaded.
 * 2. Starting the simulation when it is already running.
 * 3. Successful initialization of the simulation.
 *  4. Handling of task assignment during simulation start.
 * 5. Handling of asynchronous task assignment.
 * 6. Ensuring that the simulation status is set correctly.
 * 7. Ensuring that the simulation step interval is set correctly.
 */
describe('SimulationEngineService.startSimulation', () => {
    let mockSimulationStateService: jest.Mocked<SimulationStateService>;
    let mockPathfindingService: jest.Mocked<PathfindingService>;
    let mockTaskAssignmentService: jest.Mocked<TaskAssignmentService>;
    let engine: SimulationEngineService;
    let setIntervalSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSimulationStateService = new SimulationStateService() as jest.Mocked<SimulationStateService>;
        mockPathfindingService = new PathfindingService() as jest.Mocked<PathfindingService>;
        mockTaskAssignmentService = new TaskAssignmentService() as jest.Mocked<TaskAssignmentService>;
        engine = new SimulationEngineService(
            mockSimulationStateService,
            mockPathfindingService,
            mockTaskAssignmentService
        );
        setIntervalSpy = jest.spyOn(global, 'setInterval');
    });

    afterEach(() => {
        setIntervalSpy.mockRestore();
    });

    test('should throw an error if no grid is currently loaded', async () => {
        mockSimulationStateService.getCurrentGrid.mockReturnValue(null);
        await expect(engine.startSimulation()).rejects.toThrow(
            'SIM_ENGINE_SERVICE: Cannot start simulation, no grid loaded.'
        );
        expect(mockSimulationStateService.setSimulationStatus).not.toHaveBeenCalled();
        expect(mockTaskAssignmentService.assignTasksOnInit).not.toHaveBeenCalled();
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    test('should return early and not take any action if the simulation is already running', async () => {
        const mockGrid: Cell[][] = [[{ type: 'walkable', coordinates: { x: 0, y: 0 } }]];
        mockSimulationStateService.getCurrentGrid.mockReturnValue(mockGrid);
        mockSimulationStateService.getSimulationStatus.mockReturnValue('running');
        await engine.startSimulation();
        expect(mockSimulationStateService.setSimulationStatus).not.toHaveBeenCalled();
        expect(mockTaskAssignmentService.assignTasksOnInit).not.toHaveBeenCalled();
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    test('should perform all initialization steps on a successful start', async () => {
        const mockGrid: Cell[][] = [[{ type: 'walkable', coordinates: { x: 0, y: 0 } }]];
        mockSimulationStateService.getCurrentGrid.mockReturnValue(mockGrid);
        mockSimulationStateService.getSimulationStatus.mockReturnValue('idle');
        mockTaskAssignmentService.assignTasksOnInit.mockImplementation(() => {});
        await engine.startSimulation();
        expect(mockSimulationStateService.setSimulationStatus).toHaveBeenCalledWith('running');
        expect(mockSimulationStateService.setSimulationStatus).toHaveBeenCalledTimes(1);
        expect(mockTaskAssignmentService.assignTasksOnInit).toHaveBeenCalledTimes(1);
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        expect(setIntervalSpy).toHaveBeenCalledWith(
            expect.any(Function),
            BASE_SIMULATION_STEP_INTERVAL_MS
        );
    });

    test('should not call assignTasksOnInit if taskAssignmentService is not provided', async () => {
        engine = new SimulationEngineService(
            mockSimulationStateService,
            mockPathfindingService,
            undefined as any
        );
        const mockGrid: Cell[][] = [[{ type: 'walkable', coordinates: { x: 0, y: 0 } }]];
        mockSimulationStateService.getCurrentGrid.mockReturnValue(mockGrid);
        mockSimulationStateService.getSimulationStatus.mockReturnValue('idle');
        await engine.startSimulation();
        expect(mockSimulationStateService.setSimulationStatus).toHaveBeenCalledWith('running');
        expect(mockTaskAssignmentService.assignTasksOnInit).not.toHaveBeenCalled();
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    test('should correctly handle an asynchronous task assignment that takes time', async () => {
        const mockGrid: Cell[][] = [[{ type: 'walkable', coordinates: { x: 0, y: 0 } }]];
        mockSimulationStateService.getCurrentGrid.mockReturnValue(mockGrid);
        mockSimulationStateService.getSimulationStatus.mockReturnValue('idle');
        const assignTasksPromise = new Promise(resolve => setTimeout(resolve, 100));
        mockTaskAssignmentService.assignTasksOnInit.mockReturnValue(undefined);
        const startPromise = engine.startSimulation();
        expect(setIntervalSpy).not.toHaveBeenCalled();
        await jest.advanceTimersByTimeAsync(100);
        await startPromise;
        expect(mockTaskAssignmentService.assignTasksOnInit).toHaveBeenCalledTimes(1);
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });
});

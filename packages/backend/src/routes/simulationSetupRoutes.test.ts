
import request from 'supertest';
import { Cell } from '@common/types'; 

jest.mock('../config/supabaseClient', () => ({
    __esModule: true,
    supabaseApiPublicClient: {}, 
}));

const getGridByIdMock = jest.fn();

jest.mock('../services/supabaseService', () => {
    return {
        __esModule: true,
        SupabaseService: class {
            getGridById = getGridByIdMock;
        },
    };
});

const initializeSimulationMock = jest.fn();
const addRobotMock = jest.fn();
const addTaskMock = jest.fn();
const setStrategyMock = jest.fn();
const resetSimulationSetupMock = jest.fn();
const getCurrentGridMock = jest.fn();
const getCurrentGridIdMock = jest.fn();
const getCurrentGridNameMock = jest.fn();
const getRobotsMock = jest.fn();
const getTasksMock = jest.fn();
const getSelectedStrategyMock = jest.fn();
const getSimulationStatusMock = jest.fn();
const getSimulationTimeMock = jest.fn();

jest.mock('../services/simulationStateService', () => ({
    __esModule: true,
    simulationStateService: {
        initializeSimulation: initializeSimulationMock,
        addRobot: addRobotMock,
        addTask: addTaskMock,
        setStrategy: setStrategyMock,
        resetSimulationSetup: resetSimulationSetupMock,
        getCurrentGrid: getCurrentGridMock,
        getCurrentGridId: getCurrentGridIdMock,
        getCurrentGridName: getCurrentGridNameMock,
        getRobots: getRobotsMock,
        getTasks: getTasksMock,
        getSelectedStrategy: getSelectedStrategyMock,
        getSimulationStatus: getSimulationStatusMock,
        getSimulationTime: getSimulationTimeMock,
    },
}));

import app from '../app';

describe('Simulation Setup Routes API', () => {
    const mockGridLayout: Cell[][] = [
        [{ type: 'walkable', coordinates: { x: 0, y: 0 } }, { type: 'wall', coordinates: { x: 1, y: 0 } }],
        [{ type: 'chargingStation', coordinates: { x: 0, y: 1 } }, { type: 'walkable', coordinates: { x: 1, y: 1 } }],
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        getCurrentGridMock.mockReturnValue(null);
        getCurrentGridIdMock.mockReturnValue(null);
        getCurrentGridNameMock.mockReturnValue(null);
        getRobotsMock.mockReturnValue([]);
        getTasksMock.mockReturnValue([]);
        getSelectedStrategyMock.mockReturnValue(null);
        getSimulationStatusMock.mockReturnValue('idle');
        getSimulationTimeMock.mockReturnValue(0);
    });

    describe('POST /api/simulation/setUp/:id', () => {
        it('should initialize simulation with a valid grid ID', async () => {
            const gridId = 'test-grid-id';
            const mockGrid = {
                id: gridId,
                name: 'Test Grid',
                layout: mockGridLayout,
            };
            getGridByIdMock.mockResolvedValueOnce(mockGrid); // Mock SupabaseService

            const res = await request(app).post(`/api/simulation/setUp/${gridId}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Simulation initialized' });
            expect(getGridByIdMock).toHaveBeenCalledTimes(1);
            expect(getGridByIdMock).toHaveBeenCalledWith(gridId);
            expect(initializeSimulationMock).toHaveBeenCalledTimes(1);
            expect(initializeSimulationMock).toHaveBeenCalledWith(mockGrid.id, mockGrid.name, mockGrid.layout);
        });

        it('should return 404 if grid ID is not found', async () => {
            const gridId = 'non-existent-grid-id';
            getGridByIdMock.mockResolvedValueOnce(null); // Mock SupabaseService

            const res = await request(app).post(`/api/simulation/setUp/${gridId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Grid not found or invalid' });
            expect(getGridByIdMock).toHaveBeenCalledTimes(1);
            expect(getGridByIdMock).toHaveBeenCalledWith(gridId);
            expect(initializeSimulationMock).not.toHaveBeenCalled(); // Ensure initialize was NOT called
        });

        it('should return 500 if SupabaseService throws an error', async () => {
            const gridId = 'error-grid-id';
            const mockError = new Error('Supabase DB error');
            getGridByIdMock.mockRejectedValueOnce(mockError); // Mock SupabaseService

            const res = await request(app).post(`/api/simulation/setUp/${gridId}`);

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(getGridByIdMock).toHaveBeenCalledTimes(1);
            expect(getGridByIdMock).toHaveBeenCalledWith(gridId);
            expect(initializeSimulationMock).not.toHaveBeenCalled();
        });
    });

   describe('POST /api/simulation/placeRobot', () => {
        const robotLocation = { x: 0, y: 0 }; 
        const iconType = 'robot_icon_green.png';
        const mockRobot = { id: 'robot-123', currentLocation: robotLocation, iconType, battery: 100, status: 'idle' };

        it('should place a robot at a valid location', async () => {
            addRobotMock.mockReturnValueOnce(mockRobot);

            const res = await request(app)
                .post('/api/simulation/placeRobot')
                .send({ location: robotLocation, iconType });

            expect(res.status).toBe(200); 
            expect(res.body).toEqual({ robot: mockRobot });
            expect(addRobotMock).toHaveBeenCalledTimes(1);
            expect(addRobotMock).toHaveBeenCalledWith(robotLocation, iconType);
        });

        it('should return 400 if location is invalid (as determined by SimulationStateService)', async () => {
            const invalidLocation = { x: 1, y: 0 }; 
            addRobotMock.mockReturnValueOnce(null); 

            const res = await request(app)
                .post('/api/simulation/placeRobot')
                .send({ location: invalidLocation, iconType });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'invalid placement location for task' });
            expect(addRobotMock).toHaveBeenCalledTimes(1);
            expect(addRobotMock).toHaveBeenCalledWith(invalidLocation, iconType);
        });

        it('should return 400 if iconType is missing', async () => {
            const res = await request(app)
                .post('/api/simulation/placeRobot')
                .send({ location: robotLocation });

            expect(res.status).toBe(400);
            // Note: Controller message is general for bad params
            expect(res.body).toEqual({ error: 'invalid parameters for placeRobot controler' });
            expect(addRobotMock).not.toHaveBeenCalled();
        });

         it('should return 400 if location is missing', async () => {
            const res = await request(app)
                .post('/api/simulation/placeRobot')
                .send({ iconType });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'invalid parameters for placeRobot controler' });
            expect(addRobotMock).not.toHaveBeenCalled();
        });


        it('should return 500 if SimulationStateService throws an error', async () => {
            const mockError = new Error('State service error');
            addRobotMock.mockImplementationOnce(() => { throw mockError; }); // Mock SimulationStateService throws

            const res = await request(app)
                .post('/api/simulation/placeRobot')
                .send({ location: robotLocation, iconType });

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(addRobotMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/simulation/placeTask', () => {
        const taskLocation = { x: 1, y: 1 }; // Valid placement location in mockGridLayout
        const mockTask = { id: 'task-456', location: taskLocation, status: 'unassigned' };

        
        it('should place a task at a valid location', async () => {
            addTaskMock.mockReturnValueOnce(mockTask); 

            const res = await request(app)
                .post('/api/simulation/placeTask')
                .send(taskLocation); 

            expect(res.status).toBe(200); 
            expect(res.body).toEqual({ task: mockTask });
            expect(addTaskMock).toHaveBeenCalledTimes(1);
            expect(addTaskMock).toHaveBeenCalledWith(taskLocation);
        });

        it('should return 400 if location is invalid (as determined by SimulationStateService)', async () => {
            const invalidLocation = { x: 1, y: 0 }; 
            addTaskMock.mockReturnValueOnce(null); 

            const res = await request(app)
                .post('/api/simulation/placeTask')
                .send(invalidLocation);

            expect(res.status).toBe(400);
             // Note: Controller message is general for bad params
            expect(res.body).toEqual({ error: 'invalid placement location for task' });
            expect(addTaskMock).toHaveBeenCalledTimes(1);
            expect(addTaskMock).toHaveBeenCalledWith(invalidLocation);
        });

        it('should return 400 if x coordinate is missing', async () => {
            const res = await request(app)
                .post('/api/simulation/placeTask')
                .send({ y: 1 });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'invalid parameters for placeRobot controler' });
            expect(addTaskMock).not.toHaveBeenCalled();
        });
         it('should return 400 if y coordinate is missing', async () => {
            const res = await request(app)
                .post('/api/simulation/placeTask')
                .send({ x: 1 });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'invalid parameters for placeRobot controler' });
            expect(addTaskMock).not.toHaveBeenCalled();
        });


        it('should return 500 if SimulationStateService throws an error', async () => {
             const mockError = new Error('State service error');
            addTaskMock.mockImplementationOnce(() => { throw mockError; }); // Mock SimulationStateService throws

            const res = await request(app)
                .post('/api/simulation/placeTask')
                .send(taskLocation);

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(addTaskMock).toHaveBeenCalledTimes(1);
        });
    });

describe('POST /api/simulation/selectStrategy', () => {
        it('should set strategy to "nearest"', async () => {
            const strategy = 'nearest';

            const res = await request(app)
                .post('/api/simulation/selectStrategy')
                .send({ strategy });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Strategy selected successfully' });
            expect(setStrategyMock).toHaveBeenCalledTimes(1);
            expect(setStrategyMock).toHaveBeenCalledWith(strategy);
        });

        it('should set strategy to "round-robin"', async () => {
            const strategy = 'round-robin';

            const res = await request(app)
                .post('/api/simulation/selectStrategy')
                .send({ strategy });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Strategy selected successfully' });
            expect(setStrategyMock).toHaveBeenCalledTimes(1);
            expect(setStrategyMock).toHaveBeenCalledWith(strategy);
        });

        it('should return 400 for an invalid strategy', async () => {
            const strategy = 'invalid-strategy';

            const res = await request(app)
                .post('/api/simulation/selectStrategy')
                .send({ strategy });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'Invalid strategy parameter' });
            expect(setStrategyMock).not.toHaveBeenCalled();
        });

         it('should return 400 if strategy is missing', async () => {
            const res = await request(app)
                .post('/api/simulation/selectStrategy')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'Invalid strategy parameter' });
            expect(setStrategyMock).not.toHaveBeenCalled();
        });


        it('should return 500 if SimulationStateService throws an error', async () => {
            const strategy = 'nearest';
            const mockError = new Error('State service error');
            setStrategyMock.mockImplementationOnce(() => { throw mockError; }); // Mock SimulationStateService throws

            const res = await request(app)
                .post('/api/simulation/selectStrategy')
                .send({ strategy });

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(setStrategyMock).toHaveBeenCalledTimes(1); // It is called before the error is thrown
        });
    });

describe('POST /api/simulation/resetSetup', () => {
        it('should reset the simulation setup', async () => {
            const res = await request(app).post('/api/simulation/resetSetup');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Simulation reset successfully' });
            expect(resetSimulationSetupMock).toHaveBeenCalledTimes(1);
        });

         it('should return 500 if SimulationStateService throws an error', async () => {
            const mockError = new Error('State service error');
            resetSimulationSetupMock.mockImplementationOnce(() => { throw mockError; }); // Mock SimulationStateService throws

            const res = await request(app).post('/api/simulation/resetSetup');

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(resetSimulationSetupMock).toHaveBeenCalledTimes(1);
        });
    });

describe('GET /api/simulation/getSetupState', () => {
        it('should return the current simulation setup state', async () => {
            // Mock all the getters that the controller uses
            const mockGridId = 'some-grid-id';
            const mockGridName = 'Some Grid';
            const mockRobots = [{ id: 'r1', status: 'idle' }];
            const mockTasks = [{ id: 't1', status: 'unassigned' }];
            const mockStrategy = 'nearest';
            const mockStatus = 'idle';
            const mockTime = 0;

            getCurrentGridMock.mockReturnValueOnce(mockGridLayout);
            getCurrentGridIdMock.mockReturnValueOnce(mockGridId);
            getCurrentGridNameMock.mockReturnValueOnce(mockGridName);
            getRobotsMock.mockReturnValueOnce(mockRobots);
            getTasksMock.mockReturnValueOnce(mockTasks);
            getSelectedStrategyMock.mockReturnValueOnce(mockStrategy);
            getSimulationStatusMock.mockReturnValueOnce(mockStatus);
            getSimulationTimeMock.mockReturnValueOnce(mockTime);


            const res = await request(app).get('/api/simulation/getSetupState');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                currentGrid: mockGridLayout,
                gridId: mockGridId,
                gridName: mockGridName,
                robots: mockRobots,
                tasks: mockTasks,
                selectedStrategy: mockStrategy,
                simulationStatus: mockStatus,
                simulationTime: mockTime,
            });

            // Verify all necessary getters were called
            expect(getCurrentGridMock).toHaveBeenCalledTimes(1);
            expect(getCurrentGridIdMock).toHaveBeenCalledTimes(1);
            expect(getCurrentGridNameMock).toHaveBeenCalledTimes(1);
            expect(getRobotsMock).toHaveBeenCalledTimes(1);
            expect(getTasksMock).toHaveBeenCalledTimes(1);
            expect(getSelectedStrategyMock).toHaveBeenCalledTimes(1);
            expect(getSimulationStatusMock).toHaveBeenCalledTimes(1);
            expect(getSimulationTimeMock).toHaveBeenCalledTimes(1);
        });

        it('should return state with nulls/empty arrays if no grid is initialized', async () => {

            const res = await request(app).get('/api/simulation/getSetupState');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                currentGrid: null,
                gridId: null,
                gridName: null,
                robots: [],
                tasks: [],
                selectedStrategy: null,
                simulationStatus: 'idle',
                simulationTime: 0,
            });
            expect(getCurrentGridMock).toHaveBeenCalledTimes(1);
            expect(getCurrentGridIdMock).toHaveBeenCalledTimes(1);
            expect(getCurrentGridNameMock).toHaveBeenCalledTimes(1);
            expect(getRobotsMock).toHaveBeenCalledTimes(1);
            expect(getTasksMock).toHaveBeenCalledTimes(1);
            expect(getSelectedStrategyMock).toHaveBeenCalledTimes(1);
            expect(getSimulationStatusMock).toHaveBeenCalledTimes(1);
            expect(getSimulationTimeMock).toHaveBeenCalledTimes(1);
        });

        it('should return 500 if SimulationStateService getter throws an error', async () => {
            const mockError = new Error('State service getter error');
            getCurrentGridMock.mockImplementationOnce(() => { throw mockError; }); // Mock one getter to throw

            const res = await request(app).get('/api/simulation/getSetupState');

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'Internal server error' });
            expect(getCurrentGridMock).toHaveBeenCalledTimes(1);
        });
    });
});
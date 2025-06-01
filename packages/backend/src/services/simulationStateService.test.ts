import { Cell, Robot, TaskStatus } from "@common/types";
import { SimulationStateService } from "./simulationStateService";
import { DEFAULT_BATTERY_COST_TO_PERFORM_TASK, DEFAULT_MOVEMENT_COST_PER_CELL, DEFAULT_ROBOT_ICON, DEFAULT_ROBOT_MAX_BATTERY, DEFAULT_TASK_WORK_DURATION, INITIAL_CONSECUTIVE_WAIT_STEPS } from "../config/constants";
const mockWalkableCell: Cell = { type: 'walkable', coordinates: { x: 0, y: 0 } };
const mockWallCell: Cell = { type: 'wall', coordinates: { x: 0, y: 0 } };
const mockChargerCell: Cell = { type: 'chargingStation', coordinates: { x: 0, y: 0 } };
const mockEmptyCell: Cell = { type: 'empty', coordinates: { x: 0, y: 0 } };


const detailedMockLayout: Cell[][] = [
  [
    { type: 'walkable',        coordinates: { x: 0, y: 0 } }, // 0,0
    { type: 'wall',            coordinates: { x: 1, y: 0 } }, // 1,0
    { type: 'chargingStation', coordinates: { x: 2, y: 0 } }, // 2,0
  ],
  [
    { type: 'empty',           coordinates: { x: 0, y: 1 } }, // 0,1
    { type: 'walkable',        coordinates: { x: 1, y: 1 } }, // 1,1
    { type: 'wall',            coordinates: { x: 2, y: 1 } }, // 2,1
  ],
  [
    { type: 'walkable',        coordinates: { x: 0, y: 2 } }, // 0,2
  ]
];

describe("tests for initializeSimulation", () => {
  let simService: SimulationStateService;
    simService = new SimulationStateService();
    simService.initializeSimulation("id", "mockGrid", detailedMockLayout);
  
  test("should assign gridId, gridName and gridLayout to class and default other attributes", () => {
    expect(simService.getCurrentGrid()).toEqual(detailedMockLayout);
    expect(simService.getCurrentGridName()).toEqual("mockGrid");
    expect(simService.getCurrentGridId()).toEqual("id");
    expect(simService.getRobots()).toEqual([]);
    expect(simService.getTasks()).toEqual([]);
    expect(simService.getSelectedStrategy()).toBeNull();
    expect(simService.getSimulationStatus()).toEqual("idle");
    expect(simService.getSimulationTime()).toEqual(0);
  });
});
describe("tests for _isValidPlacement", () => {
  let simService: SimulationStateService;

  beforeEach(() => {
    simService = new SimulationStateService();
    // Initialize with a known grid for these tests
    simService.initializeSimulation("gridIdForPlacementTest", "PlacementTestGrid", detailedMockLayout);
  });

  // Test boundary conditions
  test("should return false for out-of-bounds coordinates (negative x)", () => {
    expect(simService._isValidPlacement({ x: -1, y: 0 }, false)).toBe(false);
  });

  test("should return false for out-of-bounds coordinates (negative y)", () => {
    expect(simService._isValidPlacement({ x: 0, y: -1 }, false)).toBe(false);
  });

  test("should return false for out-of-bounds coordinates (x >= grid width at y)", () => {
    expect(simService._isValidPlacement({ x: 3, y: 0 }, false)).toBe(false);
    expect(simService._isValidPlacement({ x: 1, y: 2 }, false)).toBe(false);
  });

  test("should return false for out-of-bounds coordinates (y >= grid height)", () => {
    expect(simService._isValidPlacement({ x: 0, y: 3 }, false)).toBe(false);
  });

  // Test different cell types
  test("should return true for 'walkable' cells", () => {
    expect(simService._isValidPlacement({ x: 0, y: 0 }, false)).toBe(true); 
    expect(simService._isValidPlacement({ x: 0, y: 0 }, true)).toBe(true);  
  });

  test("should return false for 'wall' cells", () => {
    expect(simService._isValidPlacement({ x: 1, y: 0 }, false)).toBe(false); 
    expect(simService._isValidPlacement({ x: 1, y: 0 }, true)).toBe(false);  
  });

  test("should return false for 'empty' cells", () => {
    expect(simService._isValidPlacement({ x: 0, y: 1 }, false)).toBe(false); 
    expect(simService._isValidPlacement({ x: 0, y: 1 }, true)).toBe(false);  
  });

  test("should return true for 'chargingStation' when allowOnChargerStation is true", () => {
    expect(simService._isValidPlacement(mockChargerCell.coordinates, true)).toBe(true); 
  });

  test("should return false for 'chargingStation' when allowOnChargerStation is false", () => {
    expect(simService._isValidPlacement({ x: 2, y: 0 }, false)).toBe(false); 
  });

  test("should return false if no grid is loaded", () => {
    const freshService = new SimulationStateService(); 
    expect(freshService._isValidPlacement({ x: 0, y: 0 }, false)).toBe(false);
  });
});
describe("tests for addRobot",()=>{
    let simService: SimulationStateService;
    simService = new SimulationStateService();
    simService.initializeSimulation("gridIdForPlacementTest", "PlacementTestGrid", detailedMockLayout);

  
test("should add robot with correct attributes  if coordinates are valid", () => {
      let newRobot = simService.addRobot({ x: 0, y: 0 }, DEFAULT_ROBOT_ICON);

    expect(newRobot).not.toBeNull();
  if (newRobot) {
    expect(typeof newRobot.id).toBe("string");
    expect(newRobot.id.length).toBeGreaterThan(0); 
    expect(newRobot.iconType).toBe(DEFAULT_ROBOT_ICON);
    expect(newRobot.currentLocation).toEqual({ x: 0, y: 0 });
    expect(newRobot.initialLocation).toEqual({ x: 0, y: 0 });
    expect(newRobot.battery).toEqual(DEFAULT_ROBOT_MAX_BATTERY);
    expect(newRobot.maxBattery).toEqual(DEFAULT_ROBOT_MAX_BATTERY);
    expect(newRobot.status).toBe("idle");
    expect(newRobot.assignedTaskId).toBeUndefined();
    expect(newRobot.currentTarget).toBeUndefined();
    expect(newRobot.currentPath).toBeUndefined();
    expect(newRobot.movementCostPerCell).toBe(DEFAULT_MOVEMENT_COST_PER_CELL);
    expect(newRobot.consecutiveWaitSteps).toBe(INITIAL_CONSECUTIVE_WAIT_STEPS);
  }});
  test("should add robot to robots array", () => {
        let newRobot = simService.addRobot({ x: 0, y: 0 }, DEFAULT_ROBOT_ICON);
        expect(simService.getRobots()).toContainEqual(newRobot);
  });
  //no meaning in testing edges of coordinates we have done it in _isValidPlacement testing
  test("should return null if coordinates are invalid", () => {
  let invalidRobot = simService.addRobot({ x: 1, y: 0 }, DEFAULT_ROBOT_ICON); // Wall cell
    expect(invalidRobot).toBeNull();
});
});

describe("tests for addTask", () => {
    let simService: SimulationStateService;

    beforeEach(() => {
        simService = new SimulationStateService();
        simService.initializeSimulation("gridAddTaskTest", "TestGridForAddTask", detailedMockLayout);
    });

    test("should add task with correct attributes if coordinates are valid and walkable", () => {
        const newTask = simService.addTask({ x: 0, y: 0 }); // Walkable cell
        expect(newTask).not.toBeNull();
        if (newTask) {
            expect(typeof newTask.id).toBe("string");
            expect(newTask.location).toEqual({ x: 0, y: 0 });
            expect(newTask.status).toBe<TaskStatus>("unassigned");
            expect(newTask.workDuration).toBe(DEFAULT_TASK_WORK_DURATION);
            expect(newTask.batteryCostToPerform).toBe(DEFAULT_BATTERY_COST_TO_PERFORM_TASK);
        }
    });

    test("should add task to tasks array on successful placement", () => {
        const initialTaskCount = simService.getTasks().length;
        const newTask = simService.addTask({ x: 1, y: 1 }); // Walkable cell
        expect(newTask).not.toBeNull();
        expect(simService.getTasks().length).toBe(initialTaskCount + 1);
        expect(simService.getTasks()).toContainEqual(newTask);
    });

    test("should return null and not add task if placement is on a wall", () => {
        const initialTasks = [...simService.getTasks()];
        const newTask = simService.addTask({ x: 1, y: 0 }); 
        expect(newTask).toBeNull();
        expect(simService.getTasks()).toEqual(initialTasks);
    });

    test("should return null and not add task if placement is on a charging station", () => {
        const initialTasks = [...simService.getTasks()];
        const newTask = simService.addTask({ x: 2, y: 0 }); 
        expect(newTask).toBeNull();
        expect(simService.getTasks()).toEqual(initialTasks);
    });

    test("should return null and not add task if placement is on an empty cell", () => {
        const initialTasks = [...simService.getTasks()];
        const newTask = simService.addTask({ x: 0, y: 1 }); // Empty cell
        expect(newTask).toBeNull();
        expect(simService.getTasks()).toEqual(initialTasks);
    });

    test("should return null if no grid is loaded when adding task", () => {
        const freshService = new SimulationStateService();
        const newTask = freshService.addTask({ x: 0, y: 0 });
        expect(newTask).toBeNull();
    });
});
describe("tests for deleteRobot", () => {
    let simService: SimulationStateService;

    beforeEach(() => {
        simService = new SimulationStateService();
        simService.initializeSimulation("gridIdForDeleteRobotTest", "DeleteRobotTestGrid", detailedMockLayout);
    });

    test("should delete a robot by id and return true", () => {
        const robot = simService.addRobot({ x: 0, y: 0 }, DEFAULT_ROBOT_ICON);
        expect(robot).not.toBeNull();
        if (robot) {
            const result = simService.deleteRobot(robot.id);
            expect(result).toBe(true);
            expect(simService.getRobots().find(r => r.id === robot.id)).toBeUndefined();
        }
    });

    test("should return false if robot id does not exist", () => {
        const result = simService.deleteRobot("non-existent-id");
        expect(result).toBe(false);
    });

    test("should not delete other robots", () => {
        const robot1 = simService.addRobot({ x: 0, y: 0 }, DEFAULT_ROBOT_ICON);
        const robot2 = simService.addRobot({ x: 1, y: 1 }, DEFAULT_ROBOT_ICON);
        expect(robot1).not.toBeNull();
        expect(robot2).not.toBeNull();
        if (robot1 && robot2) {
            simService.deleteRobot(robot1.id);
            const remainingRobots = simService.getRobots();
            expect(remainingRobots.find(r => r.id === robot1.id)).toBeUndefined();
            expect(remainingRobots.find(r => r.id === robot2.id)).toBeDefined();
        }
    });
});

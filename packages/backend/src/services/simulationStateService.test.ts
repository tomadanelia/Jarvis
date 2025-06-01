import { Cell } from "@common/types";
import { SimulationStateService } from "./simulationStateService";

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
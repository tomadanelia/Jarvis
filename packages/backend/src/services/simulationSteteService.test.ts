import { Cell } from "@common/types";
import { SimulationStateService } from "./simulationStateService";
 const mockLayout: Cell[][] = [[{ type: 'walkable', coordinates: { x: 0, y: 0 } },{ type: 'walkable', coordinates: { x: 1, y: 0 } },{ type: 'walkable', coordinates: { x: 2, y: 0 } },{ type: 'walkable', coordinates: { x: 3, y: 0 } },{ type: 'walkable', coordinates: { x: 4, y: 0 } }]];

describe("tests for initalizeSimulation",()=>{
const deleteLayter = new SimulationStateService();
deleteLayter.initializeSimulation("id","mockGrid",mockLayout);
test("should assign gridId,gridName and gridLayout to class and defaul other attributes ",()=>{
    expect(deleteLayter.getCurrentGrid).toEqual(mockLayout);
    expect(deleteLayter.getCurrentGridName).toEqual("mockGrid");
    expect(deleteLayter.getCurrentGridId).toEqual("id");
    expect(deleteLayter.getRobots()).toEqual([]);
    expect(deleteLayter.getTasks()).toEqual([]);
    expect(deleteLayter.getSelectedStrategy()).toBeNull();
    expect(deleteLayter.getSimulationStatus()).toEqual("idle");
    expect(deleteLayter.getSimulationTime()).toEqual(0);
});

}
);
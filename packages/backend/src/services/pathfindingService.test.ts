import { Cell,CellType,Coordinates } from '@common/types';
import {pathfindingService as p}  from './pathfindingService';
  const grid: Cell[][] = [
            [{ type: "walkable",coordinates :{x:0,y:0} },{ type: "wall",coordinates :{x:1,y:0} },{ type: "walkable",coordinates :{x:2,y:0} }], 
            [{ type: "walkable",coordinates :{x:0,y:1} },{ type: "wall",    coordinates :{x:1,y:1} },{ type: "walkable",coordinates :{x:2,y:1} }],
            [{ type: "walkable",coordinates :{x:0,y:2} },{ type: "wall",coordinates :{x:1,y:2} },{ type: "walkable",coordinates :{x:2,y:2} }],
            [{ type: "walkable",coordinates :{x:0,y:3} },{ type: "chargingStation",coordinates :{x:1,y:3} },{ type: "walkable",coordinates :{x:2,y:3} }],
            [{ type: "walkable",coordinates :{x:0,y:4} },{ type: "wall",coordinates :{x:1,y:4} },{ type: "walkable",coordinates :{x:2,y:4} }],
            [{ type: "walkable",coordinates :{x:0,y:5} },{ type: "wall",coordinates :{x:1,y:5} },{ type: "walkable",coordinates :{x:2,y:5} }],
            [{ type: "walkable",coordinates :{x:0,y:6} },{ type: "wall",coordinates :{x:1,y:6} },{ type: "walkable",coordinates :{x:2,y:6} }],
            [{ type: "walkable",coordinates :{x:0,y:7} },{ type: "wall",coordinates :{x:1,y:7} },{ type: "walkable",coordinates :{x:2,y:7} }],
            [{ type: "walkable",coordinates :{x:0,y:8} },{ type: "walkable",coordinates :{x:1,y:8} },{ type: "walkable",coordinates :{x:2,y:8} }],
        ];
describe('Pathfinding Service', () => {
    it('should find a path from start to end on a simple grid one cell is only way to go in barier', () => {

        const start1: Coordinates = { x: 0, y: 0 };
        const end1: Coordinates = { x: 2, y: 2 };
        const path1 = p.findPath(grid, start1, end1);
    
        expect(path1).toEqual([
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: 2 },
            { x: 0, y: 3 },
            { x: 1, y: 3 },
            { x: 2, y: 3 },
            { x: 2, y: 2 }
        ]);
    });   
    it('should find a path when multiple choice and walk on chargingStation  ', () => {
         const start2: Coordinates = { x: 0, y: 0 };
        const end2: Coordinates = { x: 2, y: 8 };
        const start3: Coordinates = { x: 0, y: 0 };
        const end3: Coordinates = { x: 2, y: 8 };
        const start4: Coordinates = { x: 0, y: 0 }
        const end4: Coordinates = { x: 2, y: 6 };
         const path2 = p.findPath(grid, start2, end2);
          expect(path2).toEqual([
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: 2 },
            { x: 0, y: 3 },
            { x: 1, y: 3 },
            { x: 2, y: 3 },
            { x: 2, y: 4 },
            { x: 2, y: 5 },
            { x: 2, y: 6 },
            { x: 2, y: 7 },
            { x: 2, y: 8 }
        ]);
    });
    it('should return an empty array when no path is found', () => {
        const start: Coordinates = { x: 1, y: 0 };
        const end: Coordinates = { x: 1, y: 1 };
        const path = p.findPath(grid, start, end);
    
        expect(path).toEqual([]);
    });
    it('should return same when start and end are same', () => {
        const start: Coordinates = { x: 0, y: 0 };
        const end: Coordinates = { x: 0, y: 0 };
        const path = p.findPath(grid, start, end);
    
        expect(path).toEqual([{ x: 0, y: 0 }]);
    });
    it('should throw an error for invalid grid', () => {
        const invalidGrid: Cell[][] = [];
        const start: Coordinates = { x: 0, y: 0 };
        const end: Coordinates = { x: 1, y: 1 };
    
        expect(() => p.findPath(invalidGrid, start, end)).toThrow("Invalid grid provided for pathfinding.");
    });
});


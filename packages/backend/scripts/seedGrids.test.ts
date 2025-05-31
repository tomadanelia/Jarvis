import { Cell,CellType,Coordinates } from '../../common/src/types';
import {parseCharacterMatrix} from './seedGrids';

describe('parseCharacterMatrix', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    it('should parse a simple 2x2 grid correctly', () => {
        const matrix = `.#\nc_`;
        const gridName = 'TestGrid1';
        const expected: Cell[][] = [
            [
                { type: 'walkable', coordinates: { x: 0, y: 0 } },
                { type: 'wall', coordinates: { x: 1, y: 0 } },
            ],
            [
                { type: 'chargingStation', coordinates: { x: 0, y: 1 } },
                { type: 'empty', coordinates: { x: 1, y: 1 } },
            ],
        ];
        expect(parseCharacterMatrix(matrix, gridName)).toEqual(expected);
    });

    it('should handle empty input string', () => {
        const matrix = ``;
        const gridName = 'EmptyGrid';
        expect(parseCharacterMatrix(matrix, gridName)).toEqual([]);
    });

    it('should handle input string with only whitespace', () => {
        const matrix = `   \n   \n  `;
        const gridName = 'WhitespaceGrid';
        
        expect(parseCharacterMatrix(matrix, gridName)).toEqual([]);
    });

    it('should pad shorter rows with empty cells to match maxWidth', () => {
        const matrix = `##\n.`; // Second row is shorter
        const gridName = 'RaggedGrid';
        const expected: Cell[][] = [
            [
                { type: 'wall', coordinates: { x: 0, y: 0 } },
                { type: 'wall', coordinates: { x: 1, y: 0 } },
            ],
            [
                { type: 'walkable', coordinates: { x: 0, y: 1 } },
                { type: 'empty', coordinates: { x: 1, y: 1 } }, // Padded
            ],
        ];
        expect(parseCharacterMatrix(matrix, gridName)).toEqual(expected);
    });

    it('should handle unknown characters by defaulting to wall and warning', () => {
        const matrix = `X.`;
        const gridName = 'UnknownCharGrid';
        const expected: Cell[][] = [
            [
                { type: 'wall', coordinates: { x: 0, y: 0 } }, // X becomes wall
                { type: 'walkable', coordinates: { x: 1, y: 0 } },
            ],
        ];
        expect(parseCharacterMatrix(matrix, gridName)).toEqual(expected);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            `Grid 'UnknownCharGrid': Unknown character 'X' at (0,0), defaulting to wall.`
        );
    });

    it('should correctly parse a larger example with all known characters', () => {
        const matrix = `_.#\nc.#\n.._`;
        const gridName = 'FullExample';
        const expected: Cell[][] = [
            [
                { type: 'empty', coordinates: { x: 0, y: 0 } },
                { type: 'walkable', coordinates: { x: 1, y: 0 } },
                { type: 'wall', coordinates: { x: 2, y: 0 } },
            ],
            [
                { type: 'chargingStation', coordinates: { x: 0, y: 1 } },
                { type: 'walkable', coordinates: { x: 1, y: 1 } },
                { type: 'wall', coordinates: { x: 2, y: 1 } },
            ],
            [
                { type: 'walkable', coordinates: { x: 0, y: 2 } },
                { type: 'walkable', coordinates: { x: 1, y: 2 } },
                { type: 'empty', coordinates: { x: 2, y: 2 } },
            ],
        ];
        expect(parseCharacterMatrix(matrix, gridName)).toEqual(expected);
    });

    it('should handle lines with leading/trailing spaces that get trimmed by map', () => {
        const matrix = `  .#  \n c_ `; // Spaces around significant chars
        const gridName = 'SpacedLines';
        // After matrixString.trim().split('\n').map(row => row.trim()):
        // rows = [".#", "C_"]
        // maxWidth = 2
        const expected: Cell[][] = [
            [
                { type: 'walkable', coordinates: { x: 0, y: 0 } },
                { type: 'wall', coordinates: { x: 1, y: 0 } },
            ],
            [
                { type: 'chargingStation', coordinates: { x: 0, y: 1 } },
                { type: 'empty', coordinates: { x: 1, y: 1 } },
            ],
        ];
        expect(parseCharacterMatrix(matrix, gridName)).toEqual(expected);
    });

});


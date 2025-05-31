import { SupabaseService, GridDefinitionFromDB } from './supabaseService';
import { supabaseApiPublicClient } from '../config/supabaseClient'; // This will be mocked
import { Cell } from '@common/types';

// Mock the supabaseApiPublicClient and its chainable methods
jest.mock('../config/supabaseClient', () => ({
    supabaseApiPublicClient: {
        from: jest.fn(), // This will be configured in beforeEach or tests
    },
}));

describe('SupabaseService', () => {
    let service: SupabaseService;
    let consoleErrorSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    // Mocks for chained Supabase calls
    let mockSelect: jest.Mock;
    let mockEq: jest.Mock;
    let mockSingle: jest.Mock;

    beforeEach(() => {
        service = new SupabaseService();
        // Clear all mocks before each test to ensure test isolation
        jest.clearAllMocks();

        // Define the mock implementations for the chain
        mockSingle = jest.fn(); // This will typically resolve a promise
        mockEq = jest.fn(() => ({ single: mockSingle }));
        mockSelect = jest.fn(() => ({ eq: mockEq })); // Default behavior of select leads to eq

        // Set the default mock implementation for supabaseApiPublicClient.from()
        // This returns an object that has a .select() method
        (supabaseApiPublicClient.from as jest.Mock).mockReturnValue({ select: mockSelect });

        // Spy on console methods
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console spies
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    describe('getGrids', () => {
        const mockLayout: Cell[][] = [[{ type: 'walkable', coordinates: { x: 0, y: 0 } }]];
        const mockGridsData: GridDefinitionFromDB[] = [
            { id: 'grid-1', name: 'Test Grid 1', layout: mockLayout },
            { id: 'grid-2', name: 'Test Grid 2', layout: mockLayout },
        ];

        it('should fetch and return all grids successfully', async () => {
            // For getGrids, the .select() call is the one that resolves the promise.
            // We need to make sure the `select` mock used by `from` resolves.
            const specificMockSelectForGetGrids = jest.fn().mockResolvedValueOnce({ data: mockGridsData, error: null });
            (supabaseApiPublicClient.from as jest.Mock).mockReturnValueOnce({ select: specificMockSelectForGetGrids });

            const grids = await service.getGrids();

            expect(supabaseApiPublicClient.from).toHaveBeenCalledWith('grids');
            expect(specificMockSelectForGetGrids).toHaveBeenCalledWith('id, name, layout');
            expect(grids).toEqual(mockGridsData);
            expect(consoleLogSpy).toHaveBeenCalledWith('SupabaseService: Attempting to fetch all grids...');
            expect(consoleLogSpy).toHaveBeenCalledWith(`SupabaseService: Fetched ${mockGridsData.length} grids.`);
        });

        it('should return an empty array if no grids are found', async () => {
            const specificMockSelectForGetGrids = jest.fn().mockResolvedValueOnce({ data: null, error: null });
            (supabaseApiPublicClient.from as jest.Mock).mockReturnValueOnce({ select: specificMockSelectForGetGrids });
            
            const grids = await service.getGrids();

            expect(grids).toEqual([]);
            expect(consoleLogSpy).toHaveBeenCalledWith('SupabaseService: Fetched 0 grids.');
        });

        it('should throw an error if Supabase query fails', async () => {
            const mockError = { message: 'Supabase query failed', code: 'XYZ' };
            const specificMockSelectForGetGrids = jest.fn().mockResolvedValueOnce({ data: null, error: mockError });
            (supabaseApiPublicClient.from as jest.Mock).mockReturnValueOnce({ select: specificMockSelectForGetGrids });

            await expect(service.getGrids()).rejects.toEqual(mockError);
            expect(consoleErrorSpy).toHaveBeenCalledWith('SupabaseService: Error fetching grids:', mockError.message);
        });
    });

    describe('getGridById', () => {
        const mockLayout: Cell[][] = [[{ type: 'walkable', coordinates: { x: 0, y: 0 } }]];
        const mockGridData: GridDefinitionFromDB = { id: 'grid-1', name: 'Test Grid 1', layout: mockLayout };

        it('should fetch and return a grid by ID successfully', async () => {
            // For getGridById, .single() resolves the promise.
            // The chain is from -> select -> eq -> single
            mockSingle.mockResolvedValueOnce({ data: mockGridData, error: null });
            // The default mock setup in beforeEach should handle the chaining correctly.
            // (supabaseApiPublicClient.from as jest.Mock).mockReturnValue({ select: mockSelect });
            // mockSelect.mockReturnValue({ eq: mockEq });
            // mockEq.mockReturnValue({ single: mockSingle });

            const grid = await service.getGridById('grid-1');

            expect(supabaseApiPublicClient.from).toHaveBeenCalledWith('grids');
            expect(mockSelect).toHaveBeenCalledWith('id, name, layout'); // mockSelect is from the beforeEach setup
            expect(mockEq).toHaveBeenCalledWith('id', 'grid-1');       // mockEq is from the beforeEach setup
            expect(mockSingle).toHaveBeenCalled();                     // mockSingle is from the beforeEach setup
            expect(grid).toEqual(mockGridData);
            expect(consoleLogSpy).toHaveBeenCalledWith('SupabaseService: Attempting to fetch grid by ID: grid-1...');
            expect(consoleLogSpy).toHaveBeenCalledWith('SupabaseService: Grid with ID grid-1 fetched successfully.');
        });

        it('should return null if grid with ID is not found (PGRST116 error)', async () => {
            const mockError = { message: 'Resource not found', code: 'PGRST116' };
            mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
            
            const grid = await service.getGridById('non-existent-grid');

            expect(grid).toBeNull();
            expect(consoleLogSpy).toHaveBeenCalledWith('SupabaseService: Grid with ID non-existent-grid not found.');
        });

        it('should throw an error if Supabase query fails for reasons other than not found', async () => {
            const mockError = { message: 'Another Supabase error', code: 'ANOTHER_CODE' };
            mockSingle.mockResolvedValueOnce({ data: null, error: mockError });

            await expect(service.getGridById('grid-1')).rejects.toEqual(mockError);
            expect(consoleErrorSpy).toHaveBeenCalledWith('SupabaseService: Error fetching grid by ID grid-1:', mockError.message);
        });
    });
});
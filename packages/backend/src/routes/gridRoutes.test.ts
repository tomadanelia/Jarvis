import request from 'supertest';

//  Prevent real Supabase config from loading 
jest.mock('../config/supabaseClient', () => ({
  __esModule: true,
  supabaseApiPublicClient: {},
}));

//  Create mocks for SupabaseService methods 
const getGridsMock = jest.fn();
const getGridByIdMock = jest.fn();

//  Mock the SupabaseService class 
jest.mock('../services/supabaseService', () => {
  return {
    __esModule: true,
    SupabaseService: class {
      getGrids = getGridsMock;
      getGridById = getGridByIdMock;
    },
  };
});

//  Import the app AFTER setting up mocks 
import app from '../app';

describe('Grid Routes API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/grids', () => {
    it('should return a list of grids', async () => {
      const mockGrids = [
        { id: '1', name: 'Grid One', layout: [['.', '#'], ['C', '.']] },
        { id: '2', name: 'Grid Two', layout: [['#', '.'], ['.', 'C']] },
      ];
      getGridsMock.mockResolvedValue(mockGrids);

      const res = await request(app).get('/api/grids');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGrids);
      expect(getGridsMock).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from SupabaseService.getGrids()', async () => {
      getGridsMock.mockRejectedValue(new Error('Something failed'));

      const res = await request(app).get('/api/grids');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Failed to fetch grids' });
    });
  });

  describe('GET /api/grids/:id', () => {
    it('should return a grid by ID', async () => {
      const mockGrid = {
        id: '123',
        name: 'Test Grid',
        layout: [['.', '#'], ['C', '.']],
      };
      getGridByIdMock.mockResolvedValue(mockGrid);

      const res = await request(app).get('/api/grids/123');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGrid);
      expect(getGridByIdMock).toHaveBeenCalledWith('123');
    });

    it('should return 404 if grid not found', async () => {
      getGridByIdMock.mockResolvedValue(null);

      const res = await request(app).get('/api/grids/unknown-id');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'Grid not found' });
    });

    it('should handle errors from SupabaseService.getGridById()', async () => {
      getGridByIdMock.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/grids/123');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Failed to fetch grid details' });
    });
  });
});

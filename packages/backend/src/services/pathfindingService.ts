import { Cell, Coordinates } from "@common/types";
import PF from 'pathfinding';

const algorithm = new PF.AStarFinder();
/**
 * Finds a path from the start coordinates to the end coordinates on the given grid using the A* algorithm.
 *
 * Walkable cells are those with type "walkable" or "chargingStation". All other cell types are treated as blocked.
 *
 * @param {Cell[][]} grid - The 2D array of Cell objects representing the map.
 * @param {Coordinates} start - The starting coordinates { x, y }.
 * @param {Coordinates} end - The ending coordinates { x, y }.
 * @returns {Coordinates[]} An array of coordinates representing the path from start to end (inclusive).
 *                          Returns an empty array if no path is found.
 */
const findPath = (grid: Cell[][], start: Coordinates, end: Coordinates): Coordinates[] => {
  const matrix = grid.map(row =>
    row.map(cell => (cell.type === "walkable" || cell.type === "chargingStation" ? 0 : 1))
  );
  const gridObj = new PF.Grid(matrix);
  const path = algorithm.findPath(start.x, start.y, end.x, end.y, gridObj);

  if (!path || path.length === 0) {
    return [];
  }

  return path.map(([x, y]) => ({ x, y }));
};
export default findPath;
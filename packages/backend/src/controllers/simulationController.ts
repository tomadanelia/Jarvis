import { Request, Response } from "express";
import { GridDefinitionFromDB } from "../services/supabaseService";
import { SupabaseService } from "../services/supabaseService";
import { SimulationStateService, simulationStateService } from "../services/simulationStateService";

const supabaseService = new SupabaseService();

export const simulationSetUp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const grid = await supabaseService.getGridById(req.params.id);
    if (!grid || typeof grid.id !== "string" || typeof grid.name !== "string" || !grid.layout) {
      res.status(404).json({ error: "Grid not found or invalid" });
      return;
    }

    simulationStateService.initializeSimulation(grid.id, grid.name, grid.layout);
    res.status(200).json({ message: "Simulation initialized" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const placeRobot= async (req:Request,res:Response ):Promise<void>=>{
    try {
    const {location,iconType}=req.body;
        if (!iconType || typeof iconType !== "string" || typeof location.x !== "number" || typeof location.y!=="number" ) {
      res.status(400).json({ error: "invalid parameters for placeRobot controler" });
      return;
    }
    const robot=simulationStateService.addRobot(location,iconType);
    if (robot==null){
        throw new Error("could not add there invalid   placement");
    }
    res.status(200).json({robot});
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
export const placeTask= async (req:Request,res:Response ):Promise<void>=>{
    try {
    const location=req.body;
        if (typeof location.x !== "number" || typeof location.y!=="number" ) {
      res.status(400).json({ error: "invalid parameters for placeRobot controler" });
      return;
    }
    const task=simulationStateService.addTask(location);
    if (task==null){
        throw new Error("could not add there invalid   placement");
    }
    res.status(200).json({task});
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
export const selectStrategy = async (
  req: Request,
    res: Response
): Promise<void> => {
    try {
        const { strategy } = req.body;
        if (!strategy || (strategy !== "nearest" && strategy !== "round-robin")) {
        res.status(400).json({ error: "Invalid strategy parameter" });
        return;
        }
    
        simulationStateService.setStrategy(strategy);
        if (!simulationStateService.getSelectedStrategy()) {
            res.status(404).json({ error: "Strategy not found" });
            return;
        }
    
        res.status(200).json({ message: "Strategy selected successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
    }
export const resetSetup = async (
  req: Request,
  res: Response
): Promise<void> => {
    try {
        simulationStateService.resetSimulationSetup();
        res.status(200).json({ message: "Simulation reset successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
    }       

export const getSetupState = async (
  req: Request,
    res: Response
): Promise<void> => {
    try {
        const currentGrid = simulationStateService.getCurrentGrid();
        const robots = simulationStateService.getRobots();
        const tasks = simulationStateService.getTasks();
        const selectedStrategy = simulationStateService.getSelectedStrategy();
        const simulationStatus = simulationStateService.getSimulationStatus();
        const gridId = simulationStateService.getCurrentGridId();
        const gridName = simulationStateService.getCurrentGridName();
        const simulationTime = simulationStateService.getSimulationTime();
        const setupState = {
            currentGrid,
            gridId,
            gridName,
            robots,
            tasks,
            selectedStrategy,
            simulationStatus,
            simulationTime
        };
        if (!setupState) {
            res.status(404).json({ error: "No setup state found" });
            return;
        }
        res.status(200).json(setupState);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}   
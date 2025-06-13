/**
 * Handles simulation setup, robot/task placement, strategy selection, simulation state retrieval,
 * and simulation engine control (start, pause, resume, reset, speed) for the API.
 * Each function is an Express route handler that validates input, interacts with simulation services,
 * and sends appropriate JSON responses.
 */

import { Request, Response } from "express";
import { GridDefinitionFromDB } from "../services/supabaseService";
import { SupabaseService } from "../services/supabaseService";
import { SimulationStateService, simulationStateService } from "../services/simulationStateService";
import { simulationEngineService } from "src/services/simulationEngineService";
const supabaseService = new SupabaseService();

/**
 * Initializes the simulation with a grid loaded from the database.
 * @param req Express request object (expects grid id in req.params.id)
 * @param res Express response object
 */
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
/**
 * Places a robot at a specified location with a given icon type.
 * @param req Express request object (expects location and iconType in req.body)
 * @param res Express response object
 */
export const placeRobot= async (req:Request,res:Response ):Promise<void>=>{
    try {
    const {location,iconType}=req.body;
        if (!location||!iconType || typeof iconType !== "string" || typeof location.x !== "number" || typeof location.y!=="number" ) {
      res.status(400).json({ error: "invalid parameters for placeRobot controler" });
      return;
    }
    const robot=simulationStateService.addRobot(location,iconType);
    if (robot==null){
         res.status(400).json({ error: "invalid placement location for task" });
        return;
    }
    res.status(200).json({robot});
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
/**
 * Places a task at a specified location.
 * @param req Express request object (expects location in req.body)
 * @param res Express response object
 */
export const placeTask= async (req:Request,res:Response ):Promise<void>=>{
    try {
    const location=req.body;
        if (!location||typeof location.x !== "number" || typeof location.y!=="number" ) {
      res.status(400).json({ error: "invalid parameters for placeRobot controler" });
      return;
    }
    const task=simulationStateService.addTask(location);
    if (task==null){
        res.status(400).json({ error: "invalid placement location for task" });
        return;}
    res.status(200).json({task});
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
/**
 * Selects the simulation strategy ('nearest' or 'round-robin').
 * @param req Express request object (expects strategy in req.body)
 * @param res Express response object
 */
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
    
        res.status(200).json({ message: "Strategy selected successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
    }
/**
 * Retrieves the current simulation setup state, including grid, robots, tasks, strategy, status, and time.
 * @param req Express request object
 * @param res Express response object
 */
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
/**
 * starts simulationEngine by calling its startSimulation method
 * @param req post request
 * @param res void 
 */
export const start = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!simulationStateService.getCurrentGrid()){
      res.status(400).json({message:"cannot start simulation currentGrid is null"})
    return;
    }
   await simulationEngineService.startSimulation();
   res.status(200).json({message:"simulationEngine has started"});
  } catch (error:any) {
    res.status(400).json({ error: error.message });
    console.error(error);
  }
}
/**
 * Pauses the simulation engine.
 * @param req Express request object
 * @param res Express response object
 */
export const pause= async (
  req:Request,
  res:Response
):Promise<void>=>{
try {
  simulationEngineService.pauseSimulation();
  res.status(200).json({message:"simulation paused successfully"});
} catch (error) {
  res.status(400).json({error:"could not pause simulation some error" })
}
}
/**
 * Resumes the simulation engine.
 * @param req Express request object
 * @param res Express response object
 */
export const resume= async (
  req:Request,
  res:Response
):Promise<void>=>{
  try {
    simulationEngineService.resumeSimulation();
  res.status(200).json({message:"simulation resumed succesfully"})
  } catch (error) {
      res.status(400).json({error:"could not resume simulation some error" })

  }
  
}
/**
 * Resets the simulation engine and state.
 * @param req Express request object
 * @param res Express response object
 */
export const reset= async (
  req:Request,
  res:Response
):Promise<void>=>{
  try {
    simulationEngineService.resetSimulation();
  res.status(200).json({message:"simulation reseted succesfully"})
  } catch (error) {
      res.status(400).json({error:"could not reset simulation some error" })

  }
}
/**
 * Sets the simulation speed factor.
 * @param req Express request object (expects factor in req.body)
 * @param res Express response object
 */
export const speed= async (
  req:Request,
  res:Response
):Promise<void>=>{
try {
    const { factor } = req.body; // <-- Destructure the property from the body
  if (!Number.isFinite(factor)||factor<=0||!factor||typeof factor!="number"){
    res.status(400).json({error:"invalid type of factor or null factor for speed"})
return;  
  }
  simulationEngineService.setSpeedFactor(factor);
  res.status(200).json({message:"speedfactor set successfully"})
} catch (error) {
        res.status(500).json({error:"error in setspeedfactor interval server error" })

}
  

}
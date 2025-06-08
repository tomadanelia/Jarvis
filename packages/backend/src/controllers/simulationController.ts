import { Request, Response } from "express";
import { GridDefinitionFromDB } from "../services/supabaseService";
import { SupabaseService } from "../services/supabaseService";
import { simulationStateService } from "../services/simulationStateService";

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
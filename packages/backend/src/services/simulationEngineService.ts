class SimulationEngineService {
  private static instance: SimulationEngineService;




  public async startSimulation(): Promise<void> {
    // Logic to start the simulation
  }

  public async stopSimulation(): Promise<void> {
    // Logic to stop the simulation
  }

  public async resetSimulation(): Promise<void> {
  }
}
const simulationEngineService = new SimulationEngineService();
export { simulationEngineService };
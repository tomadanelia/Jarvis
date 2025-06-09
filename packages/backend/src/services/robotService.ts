import { SimulationStateService, simulationStateService } from './simulationStateService';

export class RobotService {
  constructor(private simulationState: SimulationStateService) {}

  nextStep(robotId: string) {
    const robot = this.simulationState.getRobotById(robotId);
    if (!robot) return;
    // ...robot logic for next step
  }

  assignTask(robotId: string, taskId: string) {
    // ...assign task logic
  }
}

export const robotService = new RobotService(simulationStateService);
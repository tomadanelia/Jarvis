// packages/common/src/types.ts

export interface Coordinates{
    x:number;
    y:number;
}
export type CellType = `walkable`|`wall`|`chargingStation`|`empty`;
export interface Cell{
    type:CellType;
    coordinates:Coordinates;
}
export type SimulationStatus = 'idle' | 'running' | 'paused';

 
export type TaskStatus = `unassigned`|`assigned`|`inProgress`|`completed`;
export interface Task{
    id: string;
    location:Coordinates;
    status:TaskStatus;
    workDuration:number;
    batteryCostToPerform:number;
}
export type RobotType = 'worker' | 'charger';

export type RobotStatus=
`onChargingWay`
|`idle`
|`onTaskWay`
|`charging`
|`performingTask`
| `onChargeeWay`      //  On the way to a robot that needs charging
 | `deliveringCharge`;  //Actively charging another robot
export interface Robot{
    id: string;
    iconType:string;
    type: RobotType;
    targetRobotId?: string;
    battery:number;
    maxBattery:number;
    status:RobotStatus;
    assignedTaskId?:string;
    currentTarget?: Coordinates;
    currentPath?: Coordinates[];
    movementCostPerCell: number;
    consecutiveWaitSteps: number;
    currentLocation: Coordinates;
    initialLocation: Coordinates;
    workProgress?: number;
    waitingBecauseOfRobotId?: string; 

}

// --- NEWLY ADDED ---
/**
 * Represents the credentials for signing up or logging in.
 */
export interface UserCredentials {
  email: string;
  password: string;
}
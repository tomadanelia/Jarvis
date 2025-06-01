export interface Coordinates{
x:number;
y:number;
}
export type CellType = `walkable`|`wall`|`chargingStation`|`empty`;
export interface Cell{
    type:CellType;
    coordinates:Coordinates;
}

 
export type TaskStatus = `unassigned`|`assigned`|`inProgress`|`completed`;
export interface Task{
    id: string;
    location:Coordinates;
    status:TaskStatus;
    workDuration:number;
    batteryCostToPerform:number;
}
export type RobotStatus=`onChargingWay`|`idle`|`onTaskWay`|`charging`|`performingTask`;
export interface Robot{
    id: string;
    iconType:string;
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
}
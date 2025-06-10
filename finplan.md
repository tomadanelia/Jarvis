# Robot Task Simulation: Development Blueprint & Iterative Prompts

This document outlines a detailed, step-by-step plan for building the Robot Task Simulation project, broken down into iterative chunks suitable for test-driven development.

## I. Detailed Blueprint & Iterative Chunks

This blueprint focuses on building the backend first, establishing core logic and APIs, then integrating the frontend, and finally adding WebSockets for real-time updates.

**Phase 0: Project Setup & Core Definitions**

1.  **P0.1: Monorepo Setup (Optional but Recommended):**
    *   Initialize a monorepo (e.g., using `npm workspaces`, `yarn workspaces`, `pnpm`, or `Nx`).
    *   Create `backend` and `frontend` packages.
    *   Create a `common` (or `shared`) package for shared TypeScript interfaces (Cell, Task, Robot).
2.  **P0.2: Backend Project Initialization:**
    *   Inside `backend`, setup Node.js with TypeScript.
    *   Install Express, `cors`, `dotenv`.
    *   Setup `tsconfig.json`, linters (ESLint), formatters (Prettier).
    *   Basic Express app structure (e.g., `src/index.ts`, `src/app.ts`).
3.  **P0.3: Frontend Project Initialization:**
    *   Inside `frontend`, setup React with TypeScript (e.g., using Vite or Create React App).
    *   Setup `tsconfig.json`, linters, formatters.
4.  **P0.4: Supabase Project Setup:**
    *   Create a new Supabase project.
    *   Define the `grids` table schema (id, name, layout, created\_at) using Supabase Studio SQL editor or migrations.
    *   Get Supabase URL and Anon Key for backend configuration.
5.  **P0.5: Shared Type Definitions:**
    *   In `common/src/types.ts` (or similar), define `Cell`, `Coordinates`, `Task`, `Robot` interfaces as per the spec.
    *   Ensure backend and frontend can import these.

**Phase 1: Backend - Core Simulation Logic & Static APIs (No Simulation Loop Yet)**

1.  **B1.1: Core Entity Data Structures (Backend):**
    *   Refine `Robot` and `Task` interfaces in `backend/src/types/` or import from `common`. Add any backend-specific internal properties if needed (though aim to keep them aligned).
    *   Define constants (e.g., `ROBOT_MAX_BATTERY`, `TASK_WORK_DURATION`).
2.  **B1.2: Supabase Service (`SupabaseService`):**
    *   Create `backend/src/services/supabaseService.ts`.
    *   Initialize Supabase client.
    *   Implement `getGrids(): Promise<GridDefinition[]>` and `getGridById(id: string): Promise<GridDefinition | null>`.
    *   Unit tests mocking the Supabase client.
3.  **B1.3: Grid API Endpoints:**
    *   Create `backend/src/routes/gridRoutes.ts` and `backend/src/controllers/gridController.ts`.
    *   Implement `GET /api/grids` and `GET /api/grids/:id` using `SupabaseService`.
    *   Integration tests for these endpoints (using `supertest`).
4.  **B1.4: Simulation State Manager (`SimulationStateService` - In-Memory):**
    *   Create `backend/src/services/simulationStateService.ts`. This service will manage the *current* simulation's state (selected grid, robots, tasks, strategy, status). Initially, it's a singleton holding this data in memory.
    *   Methods:
        *   `initializeCurrentSimulation(gridName: string, gridLayout: Cell[][], strategy: 'nearest' | 'round-robin' | null)`
        *   `addRobot(location: Coordinates, iconType: string): Robot | null` (generates ID, validates placement on current grid).
        *   `addTask(location: Coordinates): Task | null` (generates ID, validates placement).
        *   `setStrategy(strategy: 'nearest' | 'round-robin')`
        *   `getRobots(): Robot[]`, `getTasks(): Task[]`, `getCurrentGrid(): Cell[][] | null`, `getCurrentGridName(): string | null`, `getSelectedStrategy(): string | null`, `getSimulationStatus(): 'idle' | 'running' | 'paused'`.
        *   `resetSimulationState()`: Resets robots to initial state, tasks to unassigned, status to idle, keeps placements and grid.
    *   Unit tests for each method, especially placement validation (needs grid data).
5.  **B1.5: Simulation Setup API Endpoints:**
    *   Create `backend/src/routes/simulationSetupRoutes.ts` (or similar) and `backend/src/controllers/simulationController.ts`.
    *   `POST /api/simulation/setup`: Calls `simulationStateService.initializeCurrentSimulation()` (after fetching grid details).
    *   `POST /api/simulation/robots`: Calls `simulationStateService.addRobot()`.
    *   `POST /api/simulation/tasks`: Calls `simulationStateService.addTask()`.
    *   `POST /api/simulation/strategy`: Calls `simulationStateService.setStrategy()`.
    *   `POST /api/simulation/reset-setup`: Calls `simulationStateService.resetSimulationState()`.
    *   Integration tests for these endpoints.
6.  **B1.6: Pathfinding Service (`PathfindingService` - A*):**
    *   Create `backend/src/services/pathfindingService.ts`.
    *   Implement A* algorithm: `findPath(grid: Cell[][], start: Coordinates, end: Coordinates): Coordinates[] | null`.
    *   Unit tests with various grid layouts, obstacles, unreachable targets.

**Phase 2: Frontend - Basic Setup & API Integration**

1.  **F2.1: API Service (`apiService.ts`):**
    *   Create `frontend/src/services/apiService.ts`.
    *   Implement functions to call backend APIs: `fetchGrids()`, `fetchGridById()`, `setupSimulation()`, `placeRobot()`, `placeTask()`, `selectStrategy()`, `resetSetup()`.
2.  **F2.2: State Management (e.g., Zustand or Context/Reducer):**
    *   Setup basic store for: `availableGrids`, `selectedGridId`, `selectedGridLayout`, `placedRobots`, `placedTasks`, `selectedStrategy`, `simulationStatus` (from backend), `errorMessages`.
3.  **F2.3: Grid Selection UI:**
    *   Component `GridSelector.tsx`: Fetches grids using `apiService`, displays dropdown. On selection, calls `apiService.setupSimulation(gridId, currentStrategy)` and updates `selectedGridId`, `selectedGridLayout` in store.
    *   Component `GridDisplay.tsx`: Takes `Cell[][]` as prop and renders it (simple colored divs for now). Also displays `placedRobots` and `placedTasks` from store.
    *   Wire `GridSelector` to fetch and display grid layout in `GridDisplay`.
4.  **F2.4: Item Placement UI:**
    *   Buttons "Place Robot", "Place Task". Mode state in UI store.
    *   `GridDisplay` onClick: if in placement mode and a grid is selected, calls `apiService.placeRobot/Task`. Backend validates.
    *   On successful placement (API returns new robot/task), update `placedRobots`/`placedTasks` in store.
5.  **F2.5: Strategy Selection UI:**
    *   Dropdown to select strategy. On change, calls `apiService.selectStrategy()`. Update `selectedStrategy` in store.

**Phase 3: Backend - Simulation Engine & Core Loop**

1.  **B3.1: Robot Controller Logic (within `SimulationStateService` or separate `RobotService`):**
   
    *Implement a method on SimulationStateService that is more like finplan.md's description. Let's call it moveRobotOneStep(robotId: string) or advanceRobotAlongPath(robotId: string).
This method should:
Find the robot by ID using a helper (_getRobotById).
Check if the robot has a currentPath and if it's not empty.
Take the next coordinate from the currentPath.
Update the robot's currentLocation to this next coordinate.
Deduct battery based on movementCostPerCell.
Remove the coordinate from the beginning of currentPath.
Update the robot's state in the internal robots array.
Return the updated robot object or success status.
    *   `moveRobot(robot: Robot)`: If `currentPath` exists, move one step, update `currentLocation`, consume battery.
    *   `startPerformingTask(robot: Robot, task: Task)`: Update statuses, deduct `batteryCostToPerform`.
    *   `workOnTask(robot: Robot, task: Task)`: If `performing_task`, decrement internal work counter for task on robot. If counter done, complete task.
    *   Battery management: `deductBatteryForMovement()`, `deductBatteryForTask()`.
    *   Unit tests for these actions.
2.  **B3.2: Task Controller Logic (within `SimulationStateService` or separate `TaskService`):**
    *   Logic for task state transitions (`unassigned`, `assigned`, etc.).
    *   Unit tests.
3.  **B3.3: Simulation Engine Service (`SimulationEngineService`):**
    *   Create `backend/src/services/simulationEngineService.ts`.
    *   Constructor takes `SimulationStateService` and `PathfindingService`.
    *   `step()`: The core simulation tick function.
        *   Iterate robots (get from `SimulationStateService`):
            *   Handle movement.
            *   Handle task performance duration.
            *   Handle charging duration.
            *   Implement collision/yielding logic (based on robot IDs).
            *   Implement deadlock prevention (re-path after N waits).
    *   `startSimulation()`: Sets `simulationStateService.simulationStatus` to `running`, starts a `setInterval` to call `step()` at configured speed.
    *   `pauseSimulation()`: Clears interval, sets status to `paused`.
    *   `resumeSimulation()`: Sets status to `running`, restarts interval.
    *   `setSimulationSpeed(factor: number)`: Adjusts interval delay.
    *   `getMetrics()`: Calculate `totalTime`, `totalRecharges`.
    *   Unit tests for `step()` under various scenarios (mocking dependencies).
4.  **B3.4: Task Assignment Service (`TaskAssignmentService`):**
    *   Create `backend/src/services/taskAssignmentService.ts`.
    *   Constructor takes `SimulationStateService`, `PathfindingService`.
    *   `assignTasksOnInit()`: Implements initial assignment for "Nearest" and "Round-Robin" based on current robots, tasks, and strategy in `SimulationStateService`. Updates robot/task states directly in `SimulationStateService`.
    *   `assignTaskToIdleRobot(idleRobot: Robot)`: For ongoing "Nearest".
    *   `assignTaskFromQueue(nextRobotIndexForRoundRobin: number)`: For ongoing "Round-Robin", finds an unassigned task and the next available robot.
    *   Helper: `isRobotAvailableForTask(robot: Robot, task: Task, pathToTask: Coordinates[])`.
    *   Unit tests for both strategies under different conditions.
5.  **B3.5: Integrate Task Assignment into `SimulationEngineService` & `SimulationStateService`:**
    *   `SimulationEngineService.startSimulation()`: Call `taskAssignmentService.assignTasksOnInit()`. Also, reset relevant simulation engine state (like current sim time).
    *   `SimulationEngineService.step()`: When a robot becomes `idle` (after task or charging):
        *   Check if needs charging. If yes, find path to charger, update robot's target/path/status in `SimulationStateService`.
        *   Else, try to assign a new task using `TaskAssignmentService`.
    *   The `TaskAssignmentService` methods will directly modify the `Robot` and `Task` objects held by `SimulationStateService`.
6.  **B3.6: Charging Logic (in Robot Controller methods / `SimulationEngineService.step()`):**
    *   Decision to charge (battery < 20% and idle).
    *   Find nearest charging station (using `PathfindingService` and `SimulationStateService.getCurrentGrid()`).
    *   Update robot status to `en_route_to_charger`, set `currentTarget`, calculate `currentPath`.
    *   When at charger, status to `charging`.
    *   Increment battery during `charging` status over fixed steps.
    *   Status `idle` when full.
7.  **B3.7: Simulation Control API Endpoints:**
    *   In `simulationSetupRoutes.ts` / `simulationController.ts`:
        *   `POST /api/simulation/control/start`: Calls `simulationEngineService.startSimulation()`.
        *   `POST /api/simulation/control/pause`: Calls `simulationEngineService.pauseSimulation()`.
        *   `POST /api/simulation/control/resume`: Calls `simulationEngineService.resumeSimulation()`.
        *   `POST /api/simulation/control/reset`:
            *   Calls `simulationEngineService.pauseSimulation()` (to stop the loop).
            *   Calls `simulationStateService.resetSimulationState()`.
            *   (Simulation engine's internal time/step counter should also be reset).
        *   `POST /api/simulation/control/speed`: Calls `simulationEngineService.setSimulationSpeed()`.
    *   Integration tests for these control endpoints.

**Phase 4: WebSocket Integration**

1.  **B4.1: WebSocket Setup (Backend - `socket.io`):**
    *   Install `socket.io`.
    *   Create `backend/src/services/webSocketManager.ts`.
    *   Initialize `socket.io` server, attach to HTTP server.
    *   Handle `connection` event:
        *   On new connection, gather full current state from `SimulationStateService` (grid, robots, tasks, status, strategy, simTime) and emit `initial_state`.
        *   Store connected clients.
    *   Methods: `broadcastSimulationUpdate(statePayload)`, `broadcastSimulationEnded(metricsPayload)`, `broadcastError(messagePayload)`, `broadcastInitialState(socket, statePayload)`.
2.  **B4.2: Integrate WebSocket Broadcasting into Backend Services:**
    *   `SimulationStateService`: After `addRobot`, `addTask`, `resetSimulationState`, `initializeCurrentSimulation`, `setStrategy`, call `webSocketManager` to broadcast the updated `initial_state` to all clients (or a more specific setup_changed event).
    *   `SimulationEngineService`:
        *   In `step()` loop, after all updates for the step, gather current state (robots, tasks, simTime, metrics) from `SimulationStateService` and call `webSocketManager.broadcastSimulationUpdate()`.
        *   When simulation ends (all tasks completed), gather final metrics and call `webSocketManager.broadcastSimulationEnded()`.
3.  **F4.1: WebSocket Client Setup (Frontend - `socket.io-client`):**
    *   Install `socket.io-client`.
    *   Create `frontend/src/services/webSocketService.ts`.
    *   Connect to backend WebSocket server.
    *   Listen for `initial_state`, `simulation_update`, `simulation_ended`, `error_message`.
    *   On receiving events, update the frontend state store (Zustand/Context).
4.  **F4.2: Frontend Dynamic Updates:**
    *   Ensure `GridDisplay`, `RobotList`, `TaskList` components re-render based on state changes driven by WebSocket messages.
    *   Display simulation time and metrics from the `simulation_update` payload.

**Phase 5: Frontend Polish & Advanced Visuals**

1.  **F5.1: Robot Icon Rendering & Movement Animation:**
    *   Use actual PNGs for robots (store in `public/assets` or similar).
    *   Animate robot movement smoothly between cells (e.g., CSS transitions on position, or a simple tweening logic if state updates are frequent enough).
    *   Display low battery indicator on robot icon.
2.  **F5.2: Task Visuals:**
    *   Distinct icons for tasks (e.g., dot, target symbol).
    *   Spinning cogwheel (e.g., CSS animation or a small SVG icon) for `in_progress` tasks.
3.  **F5.3: Information Display Panel:**
    *   Component `InfoPanel.tsx` to list robots: ID, icon, battery (as text/bar), current target/status.
4.  **F5.4: Control Panel Functionality:**
    *   Wire up Start, Pause, Resume, Reset, Slower/Faster buttons in `ControlPanel.tsx` to call respective backend APIs (via `apiService.ts`).
    *   UI should reflect simulation status from store (e.g., disable Start when running, change Start to Pause/Resume).

**Phase 6: Finalizing & Metrics Storage**

1.  **B6.1: Storing Simulation Results (Supabase):**
    *   Define `simulation_results` table in Supabase (id, grid\_id, strategy\_used, completion\_time\_steps, total\_recharges, num\_robots, num\_tasks, run\_at).
    *   In `SupabaseService`, add `saveSimulationResult(resultData)`.
    *   In `SimulationEngineService`, when simulation ends, gather necessary data and call `supabaseService.saveSimulationResult()`.
2.  **B6.2: Error Handling Improvements:**
    *   Robust error handling in backend API controllers (try-catch, send appropriate HTTP status codes and JSON error messages).
    *   Backend sends `error_message` via WebSockets for critical simulation errors.
    *   Frontend displays these errors to the user (e.g., using a toast notification).
3.  **B6.3: Comprehensive Testing:**
    *   Fill out unit, integration, and E2E tests as per the spec. Focus on scenarios like robot collisions, deadlocks, low battery leading to charging, and strategy differences.

---

## II. Iterative Prompts for LLM

**Iteration 0: Foundation & Shared Types**

*   **Step 0.1: Project Structure & Common Types**
    *(This prompt likely remains the same - ensure `ts-node` is added as a dev dep to backend if it wasn't before)*
    ```text
    # Prompt 0.1: Project Foundation and Shared Types

    **Context:** We are building a client-server robot simulation. This step establishes the project structure and core data types that will be shared between the backend (Node.js/Express/TypeScript) and frontend (React/TypeScript).

    **Task:**
    1.  Initialize a monorepo structure using npm workspaces. Create three packages within a root `robot-simulation` directory:
        *   `packages/common`: For shared TypeScript code.
        *   `packages/backend`: For the Node.js/Express server.
        *   `packages/frontend`: For the React client.
        Configure the root `package.json` for workspaces.
    2.  In `packages/common/src/types.ts`, define the following TypeScript interfaces based on the specification (Section 2):
        *   `export interface Coordinates { x: number; y: number; }`
        *   `export type CellType = 'walkable' | 'wall' | 'charging_station';`
        *   `export interface Cell { type: CellType; coordinates: Coordinates; }`
        *   `export type TaskStatus = 'unassigned' | 'assigned' | 'in_progress' | 'completed';`
        *   `export interface Task { id: string; location: Coordinates; status: TaskStatus; workDuration: number; batteryCostToPerform: number; }`
        *   `export type RobotStatus = 'idle' | 'en_route_to_task' | 'performing_task' | 'en_route_to_charger' | 'charging';`
        *   `export interface Robot { id: string; iconType: string; currentLocation: Coordinates; battery: number; maxBattery: number; status: RobotStatus; assignedTaskId?: string; currentTarget?: Coordinates; currentPath?: Coordinates[]; movementCostPerCell: number; consecutiveWaitSteps: number; }`
    3.  Set up basic `tsconfig.json` files in each package.
        *   `packages/common/tsconfig.json`: Basic config for a library (e.g., `declaration: true`, `outDir: dist`).
        *   `packages/backend/tsconfig.json`: Config for Node.js (`module: commonjs`, `esModuleInterop: true`, `outDir: dist`). Add path reference to `common`.
        *   `packages/frontend/tsconfig.json`: Typical React config (e.g., `jsx: react-jsx`). Add path reference to `common`.
    4.  Initialize `packages/backend` as a Node.js/TypeScript project.
        *   `cd packages/backend`
        *   `npm init -y`
        *   `npm install express typescript @types/express ts-node-dev dotenv cors @types/cors uuid @types/uuid`
        *   `npm install -D typescript @types/node ts-node` // Ensure ts-node is here
        *   Create `nodemon.json` for `ts-node-dev`.
        *   Create a minimal `src/index.ts` that starts an Express server on a port from `.env` (default 3001).
        *   Create `src/app.ts` to configure the Express app (json middleware, cors).
    5.  Initialize `packages/frontend` as a React/TypeScript project using Vite.
        *   `cd packages/frontend`
        *   `npm create vite@latest . -- --template react-ts` (Install in current dir)
        *   `npm install`

    **Acceptance Criteria:**
    *   The monorepo structure is created with `packages/common`, `packages/backend`, `packages/frontend`.
    *   Shared types are defined in `packages/common/src/types.ts` and compile without errors.
    *   Backend can import types from `common`.
    *   Frontend can import types from `common`.
    *   Basic backend Express server runs and is accessible.
    *   Basic frontend React app (Vite default) runs.
    *   Add simple `npm start` (or `dev`) scripts in backend and frontend `package.json`.
    ```

*   **(MODIFIED) Step P0.4 (was 1.1 in old plan): Supabase Project and Grid Table Schema**
    *(This prompt now only covers Supabase project creation, .env setup with SERVICE_ROLE_KEY, and the SQL to create the `grids` table. Sample data insertion is moved to the seeder script prompt).*
    ```text
    # Prompt P0.4: Supabase Project and Grid Table Schema

    **Context:** The backend will store grid definitions in Supabase. The `grids` table will store the full `Cell[][]` layout as JSONB, which will be populated by a seeding script.

    **Task:**
    1.  Go to [Supabase](https://supabase.com/) and create a new project.
    2.  Navigate to the "SQL Editor" in your Supabase project.
    3.  Create a new query and execute the following SQL to create the `grids` table:
        ```sql
        CREATE TABLE public.grids (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            layout JSONB NOT NULL, -- This will store the full Cell[][] structure
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
        ```
    4.  Go to Project Settings -> API in Supabase. Note down:
        *   Project URL
        *   `anon` public key
        *   `service_role` secret key
    5.  In `packages/backend`, create/update the `.env` file (and add it to `.gitignore` in `packages/backend`):
        ```env
        SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
        SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY # For seeding script
        PORT=3001
        ```

    **Acceptance Criteria:**
    *   Supabase project is created.
    *   `grids` table exists in Supabase with the correct schema (id, name, layout JSONB, created_at).
    *   Backend `.env` file is configured with Supabase credentials (URL, ANON_KEY, SERVICE_ROLE_KEY) and PORT.
    ```

**Iteration 1 (NEW): Backend - Grid Seeding from Compact Files**

*   **(NEW) Step 1.1: Create Compact Grid Definition Files**
    ```text
    # Prompt 1.1: Create Compact Grid Definition Files

    **Context:** We will define our grid layouts in a compact, human-readable text format and store these as separate files. A seeding script will later parse these and populate the database.

    **Task:**
    1.  Create a new directory: `packages/backend/scripts/grid_definitions/text_files/`.
    2.  Inside this directory, create 2-3 sample text files, each representing a grid. Use a character matrix format:
        *   `.` for 'walkable'
        *   `#` for 'wall'
        *   `C` for 'charging_station'
    3.  Example file `simple_maze.txt`:
        ```
        ...#...
        .C.#.C.
        ...#...
        .#####.
        .......
        ```
    4.  Example file `open_field.txt`:
        ```
        .....
        .....
        ..C..
        .....
        .....
        ```

    **Acceptance Criteria:**
    *   The directory `packages/backend/scripts/grid_definitions/text_files/` is created.
    *   At least two `.txt` files with compact grid definitions exist within this directory.
    ```

*   **(NEW) Step 1.2: Implement Grid Seeding Script**
    ```text
    # Prompt 1.2: Implement Grid Seeding Script

    **Context:** Create a Node.js script that reads compact grid definitions from text files, parses them into the full `Cell[][]` JSON structure, and inserts/upserts them into the Supabase `grids` table.

    **Task:**
    1.  Create `packages/backend/scripts/seedGrids.ts`.
    2.  Import necessary modules:
        *   `createClient` from `@supabase/supabase-js`.
        *   `Cell`, `CellType`, `Coordinates` from `@robot-sim/common`.
        *   `dotenv` and `path`.
        *   `promises as fs` from `fs`.
    3.  Initialize the Supabase client within the script using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the `.env` file. Ensure `dotenv.config()` is called correctly (e.g., `dotenv.config({ path: path.resolve(__dirname, '../.env') });`).
    4.  Implement a `parseCharacterMatrix(matrixString: string, gridNameForLogging: string): Cell[][]` function:
        *   Input: A multi-line string representing the compact grid.
        *   Output: The `Cell[][]` array.
        *   Logic: Trim input, split into lines, iterate characters, map to `Cell` objects with correct `type` and `coordinates`. Handle unknown characters gracefully (e.g., log warning, default to 'wall').
    5.  Implement an async `seedDatabase()` function:
        *   Define the path to the `grid_definitions/text_files/` directory.
        *   Use `fs.readdir` to get a list of files in that directory.
        *   Filter for `.txt` files.
        *   Loop through each `.txt` file:
            *   Derive a `gridName` from the filename (e.g., "simple_maze.txt" -> "Simple Maze").
            *   Use `fs.readFile` to read the compact layout string.
            *   Call `parseCharacterMatrix` to convert it to the full `Cell[][]` layout.
            *   Use `supabase.from('grids').upsert({ name: gridName, layout: fullLayout }, { onConflict: 'name' }).select()` to insert or update the grid in the database.
            *   Log success or error for each grid.
    6.  Call `seedDatabase()` at the end of the script and include error handling.
    7.  In `packages/backend/package.json`, add a script: `"seed": "ts-node ./scripts/seedGrids.ts"`.

    **Acceptance Criteria:**
    *   `seedGrids.ts` script is implemented correctly.
    *   The script successfully reads `.txt` files, parses them, and populates the `grids` table in Supabase with the full `Cell[][]` JSON in the `layout` column.
    *   Running `npm run seed -w packages/backend` executes the script without errors (assuming Supabase credentials are correct and the table exists).
    *   Data in Supabase `grids` table is verified.
    ```

**Iteration 2 (was Iteration 1 in old plan): Backend Service and API for Grids**

*   **(MODIFIED) Step 2.1 (was 1.2): Backend Supabase Service for Grids**
    *(This prompt now assumes the `layout` in Supabase is already full JSONB. The service uses the ANON_KEY for public API reads).*
    ```text
    # Prompt 2.1: Backend SupabaseService for Grids (Fetching Processed Data)

    **Context:** The backend needs a service to fetch fully processed grid data (where `layout` is already `Cell[][]`) from Supabase for its public API. This service will use the Supabase ANON_KEY. Unit tests are required.

    **Task:**
    1.  Ensure `@supabase/supabase-js` is installed in `packages/backend`.
    2.  Create `packages/backend/src/config/supabaseClient.ts` (if it doesn't exist or needs adjustment for ANON_KEY usage by the main API):
        ```typescript
        // packages/backend/src/config/supabaseClient.ts
        import { createClient, SupabaseClient } from '@supabase/supabase-js';
        import dotenv from 'dotenv';

        // Ensure .env is loaded from the correct path relative to where this might be called from
        // For services/controllers, it's usually fine if index.ts loads it first.
        // For direct script runs, explicit path might be needed if not already loaded.
        dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });


        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Use ANON key for public API

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase URL or Anon Key is missing in .env file for API client');
        }

        export const supabaseApiPublicClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        ```
    3.  Define a `GridDefinition` interface (e.g., in `services/supabaseService.ts` or import from `common` if identical) that expects `id`, `name`, and `layout: Cell[][]`.
        ```typescript
        // Example if defined in supabaseService.ts
        import { Cell } from '@robot-sim/common';
        export interface GridDefinition {
            id: string;
            name: string;
            layout: Cell[][];
        }
        ```
    4.  Create `packages/backend/src/services/supabaseService.ts`:
        ```typescript
        import { supabaseApiPublicClient } from '../config/supabaseClient'; // Use the public client
        import { GridDefinition } from './supabaseService'; // Or its actual location

        export class SupabaseService {
            public async getGrids(): Promise<GridDefinition[]> {
                const { data, error } = await supabaseApiPublicClient
                    .from('grids')
                    .select('id, name, layout'); // layout is already Cell[][]

                if (error) {
                    console.error('Error fetching grids:', error);
                    throw error;
                }
                return data || [];
            }

            public async getGridById(id: string): Promise<GridDefinition | null> {
                const { data, error } = await supabaseApiPublicClient
                    .from('grids')
                    .select('id, name, layout') // layout is already Cell[][]
                    .eq('id', id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows
                    console.error(`Error fetching grid by ID ${id}:`, error);
                    throw error;
                }
                return data;
            }
        }
        ```
    5.  Setup Jest/Vitest in `packages/backend` (if not already done).
    6.  Create unit tests for `SupabaseService` in `packages/backend/src/services/supabaseService.test.ts`.
        *   Mock `../config/supabaseClient` (specifically `supabaseApiPublicClient`).
        *   Test `getGrids()`: successful fetch (returning data with `Cell[][]` layout), empty fetch, error.
        *   Test `getGridById()`: successful fetch, not found, other error.

    **Acceptance Criteria:**
    *   `SupabaseService` is implemented to fetch pre-processed grids.
    *   `supabaseClient.ts` correctly initializes the client for public API use (ANON_KEY).
    *   Unit tests for `SupabaseService` pass with comprehensive mocking.
    ```

*   **(MODIFIED) Step 2.2 (was 1.3): Backend Grid API Endpoints**
    *(This prompt's implementation details for the controller/routes remain the same, but it now relies on the updated `SupabaseService` from Step 2.1 above which fetches pre-processed data).*
    ```text
    # Prompt 2.2: Backend Grid API Endpoints (Using Updated SupabaseService)

    **Context:** Expose API endpoints for fetching grid data. These endpoints will use the `SupabaseService` which now fetches grids with fully processed `Cell[][]` layouts. Integration tests with `supertest` are required.

    **Task:**
    1.  Ensure `supertest` and `@types/supertest` are installed in `packages/backend`.
    2.  Create/Update `packages/backend/src/controllers/gridController.ts`:
        *   Instantiate the (updated) `SupabaseService`.
        *   `getAllGrids(req, res)`: Calls `supabaseService.getGrids()` and sends the result.
        *   `getGridDetails(req, res)`: Calls `supabaseService.getGridById()` and sends the result or 404/error.
        *(Controller logic itself doesn't change much, but the data it receives from the service is now pre-processed).*
    3.  Create/Update `packages/backend/src/routes/gridRoutes.ts` to map to these controller actions.
    4.  Ensure the grid router is mounted in `packages/backend/src/app.ts` (e.g., `app.use('/api', gridRoutes)`).
    5.  Create/Update integration tests in `packages/backend/tests/integration/grids.test.ts`:
        *   Use `supertest` to test `GET /api/grids` and `GET /api/grids/:id`.
        *   Mock the `SupabaseService` methods (`getGrids`, `getGridById`) to return data that includes the full `Cell[][]` layout structure.

    **Acceptance Criteria:**
    *   Grid API endpoints (`/api/grids`, `/api/grids/:id`) are functional and correctly serve grid data with the full `layout`.
    *   Integration tests pass, using mocks for the updated `SupabaseService`.
    ```

**Iteration 2: Backend - In-Memory Simulation State (No Engine Yet)**

*   **Step 2.1: Backend SimulationStateService (Initial Setup)**

    ```text
    # Prompt 2.1: Backend SimulationStateService (Initial Setup)

    **Context:** The backend needs to manage the in-memory state of the simulation being configured (selected grid, placed items, strategy). This service acts as a temporary store for this data. Unit tests with Jest/Vitest are required.

    **Task:**
    1.  In `packages/backend`, create `src/config/constants.ts`:
        ```typescript
        export const DEFAULT_ROBOT_MAX_BATTERY = 100;
        export const DEFAULT_MOVEMENT_COST_PER_CELL = 1;
        export const DEFAULT_TASK_WORK_DURATION = 3; // simulation steps
        export const DEFAULT_BATTERY_COST_TO_PERFORM = 2; // battery units
        export const INITIAL_CONSECUTIVE_WAIT_STEPS = 0;
        ```
    2.  Create `packages/backend/src/services/simulationStateService.ts`.
    3.  Import `Cell`, `Coordinates`, `Robot`, `Task`, `RobotStatus`, `TaskStatus` from `@robot-simulation/common`.
    4.  Import constants from `src/config/constants.ts`.
    5.  Import `v4 as uuidv4` from `uuid`.
    6.  Implement a `SimulationStateService` class:
        *   Private properties:
            *   `currentGrid: Cell[][] | null = null;`
            *   `currentGridName: string | null = null;`
            *   `currentGridId: string | null = null;`
            *   `robots: Robot[] = [];`
            *   `tasks: Task[] = [];`
            *   `selectedStrategy: 'nearest' | 'round-robin' | null = null;`
            *   `simulationStatus: 'idle' | 'running' | 'paused' = 'idle';`
            *   `simulationTime: number = 0;` // Current simulation step/tick
        *   Public methods:
            *   `initializeSimulation(gridId: string, gridName: string, gridLayout: Cell[][]): void`
            *   `addRobot(location: Coordinates, iconType: string): Robot | null` (validate placement, generate UUID for ID, use constants for defaults)
            *   `addTask(location: Coordinates): Task | null` (validate placement, generate UUID for ID, use constants for defaults)
            *   `setStrategy(strategy: 'nearest' | 'round-robin'): void`
            *   `getRobots(): Robot[]`
            *   `getTasks(): Task[]`
            *   `getCurrentGrid(): Cell[][] | null`
            *   `getCurrentGridId(): string | null`
            *   `getCurrentGridName(): string | null`
            *   `getSelectedStrategy(): 'nearest' | 'round-robin' | null`
            *   `getSimulationStatus(): 'idle' | 'running' | 'paused'`
            *   `getSimulationTime(): number`
            *   `resetSimulationSetup(): void` (Resets robots to initial state, tasks to unassigned, simStatus to 'idle', simTime to 0. Keeps grid, item placements, strategy).
            *   `_isValidPlacement(location: Coordinates, allowOnCharger: boolean = false): boolean` (private helper using `this.currentGrid`).
            *   `_getRobotById(robotId: string): Robot | undefined`
            *   `_getTaskById(taskId: string): Task | undefined`
            *   `updateRobotState(robotId: string, updates: Partial<Robot>): Robot | null` (find robot, update, return)
            *   `updateTaskState(taskId: string, updates: Partial<Task>): Task | null`
    7.  Create unit tests in `packages/backend/src/services/simulationStateService.test.ts`.
        *   Test `initializeSimulation`.
        *   Test `addRobot` (success, invalid: out of bounds, on wall, no grid), ID generation.
        *   Test `addTask` (success, invalid: out of bounds, on wall, on charger, no grid), ID generation.
        *   Test `setStrategy`.
        *   Test `resetSimulationSetup`.
        *   Test getters.
        *   Test `updateRobotState` and `updateTaskState`.

    **Acceptance Criteria:**
    *   `SimulationStateService` manages simulation setup data in memory.
    *   Unit tests pass, covering placement validation, ID generation, state updates, and reset logic.
    ```

*   **Step 2.2: Backend Simulation Setup API Endpoints**

    ```text
    # Prompt 2.2: Backend Simulation Setup API Endpoints

    **Context:** Expose APIs for the frontend to configure the simulation using `SimulationStateService` and `SupabaseService`. Integration tests with `supertest` are required.

    **Task:**
    1.  In `packages/backend/src/controllers/simulationController.ts`:
        *   Create a singleton instance: `const simulationStateService = new SimulationStateService();` (or use a proper DI later).
        *   `setupSimulation(req, res)`:
            *   Body: `{ gridId: string }`.
            *   Fetch grid details using `SupabaseService`. If not found, 404.
            *   Call `simulationStateService.initializeSimulation(grid.id, grid.name, grid.layout)`.
            *   Return `200 OK` with `{ message: 'Simulation initialized with grid', gridName: grid.name }`.
        *   `placeRobot(req, res)`:
            *   Body: `{ location: Coordinates, iconType: string }`.
            *   Call `simulationStateService.addRobot(...)`. If null, return `400 Bad Request` (e.g., invalid placement).
            *   Return `201 Created` with the new robot.
        *   `placeTask(req, res)`:
            *   Body: `{ location: Coordinates }`.
            *   Call `simulationStateService.addTask(...)`. If null, return `400 Bad Request`.
            *   Return `201 Created` with the new task.
        *   `selectStrategy(req, res)`:
            *   Body: `{ strategy: 'nearest' | 'round-robin' }`.
            *   Call `simulationStateService.setStrategy(...)`.
            *   Return `200 OK`.
        *   `resetSimulationSetupEndpoint(req, res)`: (To distinguish from engine control reset)
            *   Call `simulationStateService.resetSimulationSetup()`.
            *   Return `200 OK`.
        *   `getSimulationSetupState(req, res)`: (Helper endpoint for frontend to sync if needed)
            *   Return current grid, robots, tasks, strategy, status from `simulationStateService`.
    2.  Create `packages/backend/src/routes/simulationSetupRoutes.ts`:
        *   `POST /api/simulation/setup`: `simulationController.setupSimulation`
        *   `POST /api/simulation/robots`: `simulationController.placeRobot`
        *   `POST /api/simulation/tasks`: `simulationController.placeTask`
        *   `POST /api/simulation/strategy`: `simulationController.selectStrategy`
        *   `POST /api/simulation/reset-setup`: `simulationController.resetSimulationSetupEndpoint`
        *   `GET /api/simulation/state`: `simulationController.getSimulationSetupState`
    3.  Mount this router in `app.ts` (e.g., `app.use('/api/simulation', simulationSetupRoutes)`).
    4.  Create integration tests in `packages/backend/tests/integration/simulationSetup.test.ts`:
        *   Test each endpoint: success cases, validation failures (e.g., placing robot before grid setup, placing on wall).
        *   Mock `SupabaseService` for the `/setup` endpoint.
        *   You might need to make calls in sequence for some tests (e.g., setup grid, then place robot).

    **Acceptance Criteria:**
    *   Simulation setup API endpoints are functional.
    *   Backend validates placements against the selected grid.
    *   Integration tests pass.
    ```

**Iteration 3: Backend - Pathfinding**

*   **Step 3.1: Pathfinding Service (A*)**

    ```text
    # Prompt 3.1: Backend PathfindingService (A*)

    **Context:** Robots need to navigate the grid. Implement A* pathfinding. Unit tests required.

    **Task:**
    1.  Create `packages/backend/src/services/pathfindingService.ts`.
    2.  Import `Cell`, `Coordinates` from `@robot-simulation/common`.
    3.  Implement a `PathfindingService` class or a standalone A* function:
        *   `findPath(grid: Cell[][], start: Coordinates, end: Coordinates): Coordinates[] | null`
        *   Path should be an array of `Coordinates` representing cell centers to move to, from `start` (exclusive) to `end` (inclusive). If `start` equals `end`, return an empty array. If no path, return `null`.
        *   Heuristic: Manhattan distance (`Math.abs(node.x - end.x) + Math.abs(node.y - end.y)`).
        *   Nodes in open/closed lists should store `x, y, g, h, f`, and `parent` (for path reconstruction).
        *   A priority queue (min-heap) for the open list is optimal but a sorted array can work for small grids.
    4.  Create unit tests in `packages/backend/src/services/pathfindingService.test.ts`. Test extensively:
        *   Simple direct path.
        *   Path around one obstacle.
        *   Path around multiple obstacles.
        *   No path possible (target surrounded).
        *   Start = End.
        *   Start or End out of bounds (should return `null` or throw, clarify behavior).
        *   Start or End on a 'wall' cell (should return `null`).
        *   Grids of different sizes.
        *   Path to a 'charging_station' cell.

    **Acceptance Criteria:**
    *   A* algorithm correctly implemented.
    *   Unit tests cover diverse scenarios and edge cases.
    ```

This completes the first ~3 phases of the backend setup. The next steps would involve:
*   **Frontend UI for Setup:** Implementing React components to call these backend APIs and display the setup state.
*   **Backend Simulation Engine:** Implementing the core `step()` logic, robot/task actions, task assignment.
*   **WebSocket Integration:** For real-time updates.
*   **Frontend Polish & Full Integration.**
*   **Finalizing & Metrics Storage.**

Each prompt builds upon the previous ones, ensuring that new code is integrated with existing parts and tested.
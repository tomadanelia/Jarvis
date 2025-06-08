# Robot Simulation Project TODO

## Phase 0: Project Setup & Core Definitions (Est: 2-4 hours)

### Iteration 0: Foundation & Shared Types (Est: 1.5 - 3 hours)
*   **[ ] (Est: 30-60 min) P0.1 & P0.2 (Partial): Monorepo & Backend Basic Setup**
    *   [ ] Initialize monorepo (npm workspaces).
    *   [ ] Create `packages/common`, `packages/backend`, `packages/frontend` directories.
    *   [ ] Configure root `package.json` for workspaces.
    *   [ ] `cd packages/backend`, `npm init -y`.
    *   [ ] Install backend dependencies: `express`, `typescript`, `@types/express`, 8`ts-node-dev`, `dotenv`, `cors`, `@types/cors`, `uuid`, `@types/uuid`.
    *   [ ] Install backend devDependencies: `typescript @types/node`.
    *   [ ] Create `packages/backend/tsconfig.json`.
    *   [ ] Create `packages/backend/nodemon.json` (or similar for `ts-node-dev`).
    *   [ ] Create `packages/backend/src/index.ts` (basic server start).
    *   [ ] Create `packages/backend/src/app.ts` (Express app config: cors, json).
    *   [ ] Create `packages/backend/.env` with `PORT`.
    *   [ ] Add `npm start` script to `packages/backend/package.json`.
*   **[ ] (Est: 30-45 min) P0.3 & P0.2 (Partial): Frontend Basic Setup**w
    *   [ ] `cd packages/frontend`, `npm create vite@latest . -- --template react-ts`.
    *   [ ] `npm install` in `packages/frontend`.
    *   [ ] Create `packages/frontend/tsconfig.json` (Vite usually does this, verify).
    *   [ ] Add `npm start` (dev) script to `packages/frontend/package.json`.
*   **[ ] (Est: 30-45 min) P0.5: Shared Type Definitions**
    *   [ ] Create `packages/common/tsconfig.json` (for library output).
    *   [ ] Create `packages/common/src/types.ts`.
    *   [ ] Define `Coordinates`, `CellType`, `Cell`, `TaskStatus`, `Task`, `RobotStatus`, `Robot` interfaces in `types.ts`.
8    *   [ ] Ensure `packages/backend/tsconfig.json` and `packages/frontend/tsconfig.json` can reference `packages/common` (e.g., using `paths` or `references`).
    *   [ ] Test importing a type from `common` into a dummy file in `backend` and `frontend`.

## Phase 1: Backend - Supabase Integration, Grid Seeding & API (Est: 3.5-6 hours)

### Iteration 1: Supabase Table & Grid Seeding Script (Focus on getting data IN)
*   **[ ] (Est: 15-30 min) P0.4 Step 1.1: Supabase Project Setup (Manual)**
    *   [ ] Create a new Supabase project.
    *   [ ] Note Supabase Project URL and Anon Key.
    *   [ ] Update `packages/backend/.env` with `SUPABASE_URL` and `SUPABASE_ANON_KEY` and SERVICE_ROLE_KEY.
    *   [ ] In Supabase SQL Editor, create the `grids` table schema:
        ```sql
        CREATE TABLE public.grids (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            layout JSONB NOT NULL, -- Will store the full Cell[][] structure
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
        ```
*   **[ ] (Est: 15-30 min) Step 1.2: Create Compact Grid Definition Files (Text Files)**
    *   [ ] Create directory `packages/backend/scripts/grid_definitions/text_files/`.
    *   [ ] Create 2-3 sample grid definition files (e.g., `simple_maze.txt`, `open_field.txt`) in this directory using your character matrix format (e.g., `.`, `#`, `C`).
*   **[ ] (Est: 1.5-2.5 hours) Step 1.3: Implement Grid Seeding Script (Node.js)**
    *   [ ] Ensure `ts-node` is a dev dependency in `packages/backend` (already added in P0.1).
    *   [ ] Create `packages/backend/scripts/seedGrids.ts`.
    *   [ ] Import necessary modules (`@supabase/supabase-js`, `fs/promises`, `path`, `dotenv`, shared types from `@robot-sim/common`).
    *   [ ] Implement Supabase client initialization (using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env`).
    *   [ ] Implement the `parseCharacterMatrix(matrixString: string, gridName: string): Cell[][]` function to convert compact text format to the full `Cell[][]` JSON structure.
    *   [ ] Implement the main `seedDatabase()` async function:
        *   [ ] Read all `.txt` files from the `grid_definitions/text_files/` directory.
        *   [ ] For each file:
            *   [ ] Derive a grid `name` (e.g., from filename).
            *   [ ] Read the compact layout string from the file.
            *   [ ] Call `parseCharacterMatrix` to get the full `Cell[][]` layout.
            *   [ ] Use Supabase client's `.upsert()` method to insert/update the grid in the `grids` table (with `name` and the full `layout` JSONB). Use `onConflict: 'name'` for `upsert`.
    *   [ ] Add logging for success/failure of each grid insertion.
    *   [ ] Add a script to `packages/backend/package.json`: `"seed": "ts-node ./scripts/seedGrids.ts"`.
    *   [ ] **Test:** Run the seed script (`npm run seed -w packages/backend`). Verify in Supabase Studio that the `grids` table is populated with the `name` and the correctly processed `layout` (as JSONB).

### Iteration 2: Backend Service and API for Grids (Focus on getting data OUT)

*   **[ ] (Est: 1-2 hours) Step 1.4: Backend Supabase Service for Grids (Code + Unit Tests)ჯკ**
    *   [ ] Install `@supabase/supabase-js` in `packages/backend` (if not already done, though seeding script would need it).
    *   [ ] Create `packages/backend/src/config/supabaseClient.ts` (this one will configure the client for the main API using the **ANON_KEY** for read-only access, distinct from the seeder's service role client).
    *   [ ] Define `GridDefinitionFromDB` interface in `services/supabaseService.ts` (expecting `id`, `name`, `layout: Cell[][]`).
    *   [ ] Create `packages/backend/src/services/supabaseService.ts`.
    *   [ ] Implement `SupabaseService` class (using the **anon key** client):
        *   [ ] `async getGrids(): Promise<GridDefinitionFromDB[]>` (fetches `id`, `name`, `layout`).
        *   [ ] `async getGridById(id: string): Promise<GridDefinitionFromDB | null>` (fetches `id`, `name`, `layout`).
        *   *Note: This service now assumes the `layout` in Supabase is already the full JSONB `Cell[][]`.*
    *   [ ] Setup Jest/Vitest in `packages/backend`.
    *   [ ] Write unit tests for `SupabaseService` (mocking the `supabaseClient` that uses the ANON_KEY).
*   **[ ] (Est: 1-1.5 hours) Step 1.5: Backend Grid API Endpoints (Code + Integration Tests)**
    *   [ ] Install `supertest @types/supertest` in `packages/backend`.
    *   [ ] Create `packages/backend/src/controllers/gridController.ts` (`getAllGrids`, `getGridDetails` using the `SupabaseService`).
    *   [ ] Create `packages/backend/src/routes/gridRoutes.ts`.
    *   [ ] Mount grid router in `packages/backend/src/app.ts`.
    *   [ ] Write integration tests for `GET /api/grids` and `GET /api/grids/:id` (mocking `SupabaseService`).

## Phase 2: Backend - In-Memory Simulation State (Setup Logic) (Est: 3-5 hours)

*(This phase and subsequent phases remain as they were, as they assume the grid data is available in the full `Cell[][]` format when fetched by `SupabaseService`)*

### Iteration 2: Simulation State & Setup APIs
8*   **[ ] (Est: 1.5-2.5 hours) Step 2.1: Backend SimulationStateService (Initial Setup) (Code + Unit Tests)**
    *   [ ] Create `packages/backend/src/config/constants.ts` (default robot/task values).
    *   [ ] Create `packages/backend/src/services/simulationStateService.ts`.
    *   [ ] Implement `SimulationStateService` class:
        *   [ ] Properties for `currentGrid`, `robots`, `tasks`, `selectedStrategy`, `simulationStatus`, `simulationTime`.
        *   [ ] `initializeSimulation()` method (will receive full `Cell[][]` layout).
        *   [ ] `addRobot()` method (with placement validation against `currentGrid`).
        *   [ ] `addTask()` method (with placement validation).
        *   [ ] `setStrategy()` method.
        *   [ ] Getter methods for state.
        *   [ ] `resetSimulationSetup()` method.
        *   [ ] `_isValidPlacement()` helper.
        *   [ ] `_getRobotById()`, `_getTaskById()` helpers.
        *   [ ] `updateRobotState()`, `updateTaskState()` methods.
    *   [ ] Write unit tests for `SimulationStateService`.
*   **[ ] (Est: 1.5-2.5 hours) Step 2.2: Backend Simulation Setup API Endpoints (Code + Integration Tests)**
    *   [ ] In `packages/backend/src/controllers/simulationController.ts`:
        *   [ ] Implement `setupSimulation` endpoint logic (fetches full grid from `SupabaseService` and passes to `SimulationStateService`).
        *   [ ] Implement `placeRobot` endpoint =logic.
        *   [ ] Implement `placeTask` endpoint logic.
        *   [ ] Implement `selectStrategy` endpoint logic.
        *   [ ] Implement `resetSimulationSetupEndpoint` logic.
        *   [ ] Implement `getSimulationSetupState` endpoint logic.
    *   [ ] Create/Update `packages/backend/src/routes/simulationSetupRoutes.ts`.
    *   [ ] Mount router in `app.ts`.
    *   [ ] Write integration tests for simulation setup API endpoints.


## Phase 3: Backend - Pathfinding & Core Engine Logic (Est: 4-7 hours)

### Iteration 3: Pathfinding (Est: 1.5-3 hours)
*   **[ ] (Est: 1.5-3 hours) Step 3.1: Pathfinding Service (A*) (Code + Unit Tests)**
    *   [ ] Create `packages/backend/src/services/pathfindingService.ts`.
    *   [ ] Implement A* `findPath(grid, start, end)` function/method.
    *   [ ] Write comprehensive unit tests for `PathfindingService`.

### Iteration 4: Backend Simulation Engine - Step Logic (Est: 2.5-4 hours)
*   **[ ] (Est: 1-1.5 hours) B3.1 & B3.2 (Partial): Robot & Task Action Stubs in `SimulationStateService`**
    *   [ ] In `SimulationStateService`: Add placeholder methods for robot actions that will be called by the engine:
        *   `processRobotMovement(robotId: string, pathfindingService: PathfindingService)` (calculates next step, updates location, deducts battery).
        *   `processTaskWork(robotId: string)` (updates task progress if robot is `performing_task`).
        *   `processRobotCharging(robotId: string)` (updates battery if robot is `charging`).
        *   (These will later be orchestrated by `SimulationEngineService.step()`).
    *   [ ] Add basic unit tests for these new methods in `SimulationStateService` (e.g., battery deduction, status changes).
*   **[ ] (Est: 1.5-2.5 hours) B3.3 (Partial): SimulationEngineService - Core `step()` loop, Start/Pause/Speed (No task assignment/charging decisions yet)**
    *   [ ] Create `packages/backend/src/services/simulationEngineService.ts`.
    *   [ ] Constructor takes `SimulationStateService` and `PathfindingService`.
    *   [ ] Implement `step()`:
        *   [ ] Increment `simulationStateService.simulationTime`.
        *   [ ] Iterate through `simulationStateService.getRobots()`:
            *   [ ] Call `simulationStateService.processRobotMovement()` if robot is `en_route_to_task` or `en_route_to_charger`.
            *   [ ] Call `simulationStateService.processTaskWork()` if robot is `performing_task`.
            *   [ ] Call `simulationStateService.processRobotCharging()` if robot is `charging`.
            *   [ ] Implement basic collision/yielding logic (ID-based waiting, increment `consecutiveWaitSteps`).
            *   [ ] Implement deadlock prevention (if `consecutiveWaitSteps` > threshold, try to re-path using `PathfindingService` - robot needs `currentTarget`).
    *   [ ] Implement `startSimulationMainLoop()` (sets status to `running`, starts `setInterval` for `step()`).
    *   [ ] Implement `pauseSimulationMainLoop()` (clears interval, sets status to `paused`).
    *   [ ] Implement `resumeSimulationMainLoop()` (like start).
    *   [ ] Implement `setSimulationSpeed()`.
    *   [ ] Write unit tests for `SimulationEngineService.step()` focusing on robot movement, task work progression, charging progression, collision/yielding, and deadlock re-pathing (mock dependencies heavily).

## Phase 4: Frontend - Basic UI for Setup & API Integration (Est: 4-7 hours)

### Iteration 5: Frontend API Service & State Management (Est: 1-2 hours)
*   **[ ] (Est: 30-60 min) F2.1: Frontend API Service (`apiService.ts`)**
    *   [ ] Create `packages/frontend/src/services/apiService.ts`.
    *   [ ] Implement functions to call backend Grid APIs (`fetchGrids`, `fetchGridById`).
    *   [ ] Implement functions to call backend Simulation Setup APIs (`setupSimulationApi`, `placeRobotApi`, `placeTaskApi`, `selectStrategyApi`, `resetSetupApi`, `getSimulationStateApi`).
*   **[ ] (Est: 30-60 min) F2.2: Frontend State Management Setup (Zustand/Context)**
    *   [ ] Install state management library (e.g., `zustand`).
    *   [ ] Create `packages/frontend/src/store/simulationStore.ts` (or similar).
    *   [ ] Define initial state: `availableGrids`, `selectedGridId`, `selectedGridLayout`, `robots` (from setup), `tasks` (from setup), `selectedStrategy`, `simulationStatus` (from backend), `errorMessages`, `currentPlacementMode`.
    *   [ ] Define actions/reducers for updating this state.

### Iteration 6: Frontend Grid & Item Placement UI (Est: 3-5 hours)
*   **[ ] (Est: 1-1.5 hours) F2.3 (Partial): GridSelector Component**
    *   [ ] Create `packages/frontend/src/components/GridSelector.tsx`.
    *   [ ] On mount, fetch grids using `apiService.fetchGrids()` and populate store.
    *   [ ] Display a dropdown of `availableGrids` from store.
    *   [ ] On selection, call `apiService.setupSimulationApi(selectedGridId, store.selectedStrategy)`. Update `selectedGridId` and `selectedGridLayout` in store based on API response.
*   **[ ] (Est: 1-2 hours) F2.3 (Partial) & F2.4: GridDisplay & Basic Item Placement**
    *   [ ] Create `packages/frontend/src/components/GridDisplay.tsx`.
        *   [ ] Props: `layout: Cell[][]`, `robots: Robot[]`, `tasks: Task[]`.
        *   [ ] Render grid cells (simple colored divs: grey for walkable, black for wall, yellow for charger).
        *   [ ] Render simple placeholders for robots and tasks on their `currentLocation`.
        *   [ ] Handle `onClick` on a cell.
    *   [ ] In main App component or a `SetupPage.tsx`:
        *   [ ] Add buttons "Set Robot Placement Mode", "Set Task Placement Mode", "Clear Placement Mode".
        *   [ ] Update `currentPlacementMode` in store.
        *   [ ] If `GridDisplay` cell is clicked and `currentPlacementMode` is active and `selectedGridLayout` exists:
            *   Call `apiService.placeRobotApi()` or `apiService.placeTaskApi()` with cell coordinates.
            *   On success, update `robots`/`tasks` in store with the new item returned by API.
*   **[ ] (Est: 30-60 min) F2.5: StrategySelection Component**
    *   [ ] Create `packages/frontend/src/components/StrategySelector.tsx`.
    *   [ ] Dropdown for "Nearest Available Robot", "Round-Robin".
    *   [ ] On change, call `apiService.selectStrategyApi()` and update `selectedStrategy` in store.

## Phase 5: Backend - Task Assignment & Full Engine Integration (Est: 4-7 hours)

### Iteration 7: Task Assignment Logic (Est: 2-3.5 hours)
*   **[ ] (Est: 2-3.5 hours) B3.4: TaskAssignmentService (Code + Unit Tests)**
    *   [ ] Create `packages/backend/src/services/taskAssignmentService.ts`.
    *   [ ] Constructor takes `SimulationStateService` and `PathfindingService`.
    *   [ ] Implement `isRobotAvailableForTask(robot, task, pathToTask)` helper.
    *   [ ] Implement `assignTaskToRobot(robot, task, pathToTask)` (updates robot target, path, status; task status).
    *   [ ] Implement `assignTasksOnInit()`:
        *   [ ] Logic for "Nearest Available Robot" strategy.
        *   [ ] Logic for "Round-Robin" strategy.
    *   [ ] Implement `findAndAssignTaskForIdleRobot(idleRobot: Robot)` (for ongoing "Nearest").
    *   [ ] Implement `findAndAssignTaskFromQueue(nextRobotIndexForRoundRobin: number)` (for ongoing "Round-Robin").
    *   [ ] Write unit tests for both strategies, `isRobotAvailableForTask`, and main assignment methods (mock dependencies).

### Iteration 8: Full Simulation Engine Integration (Est: 2-3.5 hours)
*   **[ ] (Est: 1.5-2.5 hours) B3.5 & B3.6: Integrate Task Assignment & Charging into SimulationEngineService**
    *   [ ] In `SimulationEngineService.startSimulationMainLoop()`:
        *   [ ] Call `taskAssignmentService.assignTasksOnInit()` before starting the loop.
        *   [ ] Reset `simulationStateService.simulationTime` to 0.
    *   [ ] In `SimulationEngineService.step()`:
        *   [ ] After a robot completes a task and becomes `idle`:
            *   [ ] Check battery: if `battery < LOW_BATTERY_THRESHOLD` (define constant).
            *   [ ] If low battery: find nearest charging station using `PathfindingService`. If found, set robot's `currentTarget`, `currentPath` (via `PathfindingService`), and status to `en_route_to_charger`. Update robot in `SimulationStateService`.
            *   [ ] Else (not low battery or no charger found/reachable): call appropriate `TaskAssignmentService` method (e.g., `findAndAssignTaskForIdleRobot`) to get a new task.
        *   [ ] After a robot finishes charging and becomes `idle`:
            *   [ ] Call appropriate `TaskAssignmentService` method.
        *   [ ] If a task becomes `completed`, ensure robot status set to `idle`.
    *   [ ] Ensure `SimulationStateService.updateRobotState/updateTaskState` are used for all changes.
*   **[ ] (Est: 30-60 min) B3.7: Simulation Control API Endpoints (Code + Integration Tests)**
    *   [ ] In `simulationController.ts` / `simulationSetupRoutes.ts`:
        *   [ ] Implement `POST /api/simulation/control/start` (calls `simulationEngineService.startSimulationMainLoop()`).
        *   [ ] Implement `POST /api/simulation/control/pause` (calls `simulationEngineService.pauseSimulationMainLoop()`).
        *   [ ] Implement `POST /api/simulation/control/resume` (calls `simulationEngineService.resumeSimulationMainLoop()`).
        *   [ ] Implement `POST /api/simulation/control/reset`:
            *   [ ] `simulationEngineService.pauseSimulationMainLoop()` (if running).
            *   [ ] `simulationStateService.resetSimulationSetup()`.
        *   [ ] Implement `POST /api/simulation/control/speed`.
    *   [ ] Write integration tests for these control endpoints (mock underlying services where necessary to check calls).

## Phase 6: WebSocket Integration (Est: 3-6 hours)

### Iteration 9: Backend WebSocket Setup (Est: 1.5-3 hours)
*   **[ ] (Est: 1-2 hours) B4.1: WebSocketManager Service (Backend)**
    *   [ ] Install `socket.io` in `packages/backend`.
    *   [ ] Create `packages/backend/src/services/webSocketManager.ts`.
    *   [ ] Initialize `socket.io` server, attach to main HTTP server in `index.ts`.
    *   [ ] `WebSocketManager` class:
        *   [ ] `constructor(httpServer, simulationStateService)`
        *   [ ] Handle `connection` event:
            *   [ ] Get full state from `simulationStateService` (grid, robots, tasks, status, strategy, simTime).
            *   [ ] Emit `initial_state` to the connected client.
        *   [ ] `broadcastSimulationUpdate()`: Emits `simulation_update` with current robots, tasks, simTime, metrics to all clients.
        *   [ ] `broadcastSimulationEnded()`: Emits `simulation_ended` with final metrics.
        *   [ ] `broadcastError()`: Emits `error_message`.
        *   [ ] `broadcastInitialStateToAll()` (or specific event for setup changes).
*   **[ ] (Est: 30-60 min) B4.2: Integrate WebSocket Broadcasting**
    *   [ ] Inject/Pass `WebSocketManager` instance to `SimulationStateService` and `SimulationEngineService`.
    *   [ ] `SimulationStateService`: After setup changes (`addRobot`, `addTask`, `resetSimulationSetup`, `initializeSimulation`, `setStrategy`), call `webSocketManager.broadcastInitialStateToAll()` (or specific event).
    *   [ ] `SimulationEngineService`:
        *   [ ] In `step()` loop, after updates, call `webSocketManager.broadcastSimulationUpdate()`.
        *   [ ] On simulation end, call `webSocketManager.broadcastSimulationEnded()`.

### Iteration 10: Frontend WebSocket Client (Est: 1.5-3 hours)
*   **[ ] (Est: 1-1.5 hours) F4.1: Frontend WebSocketService & Store Integration**
    *   [ ] Install `socket.io-client` in `packages/frontend`.
    *   [ ] Create `packages/frontend/src/services/webSocketService.ts`.
        *   [ ] Connect to backend WebSocket.
        *   [ ] Listen for `initial_state`, `simulation_update`, `simulation_ended`, `error_message`.
        *   [ ] On receiving events, call actions in `simulationStore.ts` to update frontend state.
    *   [ ] Update `simulationStore.ts` to handle these new states/actions.
*   **[ ] (Est: 30-60 min) F4.2: Frontend Dynamic Updates**
    *   [ ] Ensure components (`GridDisplay`, etc.) are reactive to store changes driven by WebSockets.
    *   [ ] Display `simulationTime` and basic metrics from `simulation_update` payload.

## Phase 7: Frontend Polish & Control Panel (Est: 3-6 hours)

### Iteration 11: Enhanced Visuals (Est: 1.5-3 hours)
*   **[ ] (Est: 30-60 min) F5.1 (Partial): Robot Icon Assets**
    *   [ ] Add 6-7 robot PNGs to `packages/frontend/public/assets/robots/`.
    *   [ ] Update `Robot` interface in `common` if `iconType` needs to be more specific (e.g., path to icon). `SimulationStateService.addRobot` should cycle through these or allow frontend to specify.
    *   [ ] `GridDisplay` renders the correct robot icon based on `robot.iconType`.
*   **[ ] (Est: 1-1.5 hours) F5.1 (Partial) & F5.2: Robot Movement Animation & Task Visuals**
    *   [ ] Implement smooth robot movement animation in `GridDisplay` (CSS transitions or simple tweening).
    *   [ ] Display low battery indicator on robot icon (e.g., small red dot if `battery < LOW_BATTERY_THRESHOLD`).
    *   [ ] Visual for tasks (dot/icon).
    *   [ ] Spinning cogwheel for `in_progress` tasks.
*   **[ ] (Est: 30-60 min) F5.3: Information Display Panel**
    *   [ ] Create `packages/frontend/src/components/InfoPanel.tsx`.
    *   [ ] List robots: ID/icon, battery (%), status, current target (task ID or "Charger @ (x,y)").

### Iteration 12: Control Panel (Est: 1.5-3 hours)
*   **[ ] (Est: 1.5-3 hours) F5.4: ControlPanel Component & API Calls**
    *   [ ] Create `packages/frontend/src/components/ControlPanel.tsx`.
    *   [ ] Add "Start", "Pause", "Resume", "Reset", "Slower", "Faster" buttons.
    *   [ ] Wire buttons to call backend control APIs via `apiService.ts`.
        *   `apiService.startSimulationCtrl()`, `pauseSimulationCtrl()`, etc.
    *   [ ] UI reflects simulation status (e.g., "Start" changes to "Pause", disabled states).
    *   [ ] "Reset" button should call `/api/simulation/control/reset`.

## Phase 8: Finalizing & Metrics Storage (Est: 2-4 hours)

### Iteration 13: Metrics & Error Handling (Est: 2-4 hours)
*   **[ ] (Est: 1-1.5 hours) B6.1: Storing Simulation Results in Supabase**
    *   [ ] Define `simulation_results` table schema in Supabase.
    *   [ ] `SupabaseService`: Add `saveSimulationResult(resultData)`.
    *   [ ] `SimulationEngineService`: On simulation end, call `saveSimulationResult`.
    *   [ ] Define key metrics (Total Time, Total Recharges) calculation in `SimulationEngineService.getMetrics()`.
*   **[ ] (Est: 1-1.5 hours) B6.2 & F-Error: Error Handling Improvements**
    *   [ ] Backend: Robust error handling in controllers (try-catch, specific HTTP status codes, JSON error messages).
    *   [ ] Backend: Send `error_message` via WebSockets for critical simulation errors not tied to a direct API request.
    *   [ ] Frontend: Display backend errors (from API responses or WebSocket `error_message`) to the user (e.g., toast notifications, error message area).
*   **[ ] (Est: Ongoing) B6.3: Comprehensive Testing**
    *   [ ] Review and add missing unit tests.
    *   [ ] Review and add missing integration tests.
    *   [ ] Plan and (optionally) implement E2E tests for key user flows.

This TODO list is quite granular. Feel free to combine very small sub-tasks if it makes sense for your workflow. Good luck!

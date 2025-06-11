# Robot Simulation Project TODO

## Phase 0: Project Setup & Core Definitions (Est: 2-4 hours)

### Iteration 1: Foundation & Shared Types (Est: 1.5 - 3 hours)
*   **[ ] (Est: 30-60 min) P0.1 & P0.2 (Partial): Monorepo & Backend Basic Setup**
    *   [ ] Initialize monorepo (npm workspaces).
    *   [ ] Create `packages/common`, `packages/backend`, `packages/frontend` directories.
    *   [ ] Configure root `package.json` for workspaces.
    *   [ ] `cd packages/backend`, `npm init -y`.
    *   [ ] Install backend dependencies: `express`, `typescript`, `@types/express`, `ts-node-dev`, `dotenv`, `cors`, `@types/cors`, `uuid`, `@types/uuid`.
    *   [ ] Install backend devDependencies: `typescript @types/node`.
    *   [ ] Create `packages/backend/tsconfig.json`.
    *   [ ] Create `packages/backend/nodemon.json` (or similar for `ts-node-dev`).
    *   [ ] Create `packages/backend/src/index.ts` (basic server start).
    *   [ ] Create `packages/backend/src/app.ts` (Express app config: cors, json).
    *   [ ] Create `packages/backend/.env` with `PORT`.
    *   [ ] Add `npm start` script to `packages/backend/package.json`.
*   **[ ] (Est: 30-45 min) P0.3 & P0.2 (Partial): Frontend Basic Setup**
    *   [ ] `cd packages/frontend`, `npm create vite@latest . -- --template react-ts`.
    *   [ ] `npm install` in `packages/frontend`.
    *   [ ] Create `packages/frontend/tsconfig.json` (Vite usually does this, verify).
    *   [ ] Add `npm start` (dev) script to `packages/frontend/package.json`.
*   **[ ] (Est: 30-45 min) P0.5: Shared Type Definitions**
    *   [ ] Create `packages/common/tsconfig.json` (for library output).
    *   [ ] Create `packages/common/src/types.ts`.
    *   [ ] Define `Coordinates`, `CellType`, `Cell`, `TaskStatus`, `Task`, `RobotStatus`, `Robot` interfaces in `types.ts`.
    *   [ ] Ensure `packages/backend/tsconfig.json` and `packages/frontend/tsconfig.json` can reference `packages/common` (e.g., using `paths` or `references`).
    *   [ ] Test importing a type from `common` into a dummy file in `backend` and `frontend`.

## Phase 1: Backend - Supabase Integration, Grid Seeding & API (Est: 3.5-6 hours)

### Iteration 2: Supabase Table & Grid Seeding Script (Focus on getting data IN)
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
    *   [ ] Ensure `ts-node` is a dev dependency in `packages/backend`.
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

### Iteration 3: Backend Service and API for Grids (Focus on getting data OUT)
*   **[ ] (Est: 1-2 hours) Step 1.4: Backend Supabase Service for Grids (Code + Unit Tests)**
    *   [ ] Install `@supabase/supabase-js` in `packages/backend`.
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

## Phase 2: Frontend - Basic Setup & API Integration (Est: 4-7 hours)

### Iteration 4: Backend Simulation State & Setup APIs (Est: 3-5 hours)
*   **[ ] (Est: 1.5-2.5 hours) Step 2.1: Backend SimulationStateService (Initial Setup) (Code + Unit Tests)**
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
        *   [ ] Implement `placeRobot` endpoint logic.
        *   [ ] Implement `placeTask` endpoint logic.
        *   [ ] Implement `selectStrategy` endpoint logic.
        *   [ ] Implement `resetSimulationSetupEndpoint` logic.
        *   [ ] Implement `getSimulationSetupState` endpoint logic.
    *   [ ] Create/Update `packages/backend/src/routes/simulationSetupRoutes.ts`.
    *   [ ] Mount router in `app.ts`.
    *   [ ] Write integration tests for simulation setup API endpoints.

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

## Phase 3: Backend - Simulation Engine & Core Logic (Est: 4-7 hours)

### Iteration 7: Backend Core Logic - Pathfinding, State Advancement, Assignment Service (Est: 3-5 hours)
*   **[ ] (Est: 1.5-3 hours) B3.1 (Core Algorithm): Pathfinding Service (A*) (Code + Unit Tests)**
    *   [ ] Create `packages/backend/src/services/pathfindingService.ts`.
    *   [ ] Implement A* `findPath(grid, start, end)` function/method.
    *   [ ] Write comprehensive unit tests for `PathfindingService`.
*   **[ ] (Est: 0.5-1 hour) B3.1 (State Update): `SimulationStateService` - Add Path Advancement & Task Progress**
    *   [ ] In `packages/backend/src/services/simulationStateService.ts`:
        *   Add the `advanceRobotAlongPath(robotId: string): Robot | null` method as discussed (move 1 step on existing path, deduct battery, shift path).
        *   Ensure `Task` interface (in `@common/types`) has `workProgressSteps: number = 0;`. Initialize this in `SimulationStateService.addTask`.
        *   Add a method like `incrementTaskWorkProgress(taskId: string): Task | null` or ensure `updateTaskState` is used by engine.
        *   Add a method like `incrementRobotCharging(robotId: string): Robot | null` or ensure `updateRobotState` is used.
    *   [ ] Add unit tests for these new/modified StateService methods.
*   **[ ] (Est: 2-3.5 hours) B3.4: Task Assignment Service (Code + Unit Tests)this is main logic of whole project based on selected strategy how we pair tasks and robots that is real algorithm of simulation**
    *   [ ] Create `packages/backend/src/services/taskAssignmentService.ts`.
    *   [ ] Constructor takes `SimulationStateService` and `PathfindingService`.
    *   [ ] Implement assignment logic methods (`assignTasksOnInit`, `findAndAssignTaskForIdleRobot`, etc.). These methods use `PathfindingService` and **call `SimulationStateService` methods (like `updateRobotState`) to apply assignments**.
    *   [ ] Write unit tests for `TaskAssignmentService`.

### Iteration 8: Full Simulation Engine Integration & Control APIs (Est: 2.5-4 hours)
*   **[ ] (Est: 2-3.5 hours) B3.3, B3.5, B3.6 (Integrated): `SimulationEngineService` - Core Step Logic & Controls**
    *   [ ] Create `packages/backend/src/services/simulationEngineService.ts`.
    *   [ ] Constructor takes `SimulationStateService`, `PathfindingService`, and `TaskAssignmentService`.
    *   [ ] Implement `private step(): void`. **This method orchestrates the simulation tick**: increments time, loops robots, checks status, *makes decisions* (e.g., call TaskAssignmentService, find charger), *calls StateService methods* (`advanceRobotAlongPath`, `updateRobotState`, `updateTaskState`) to apply state changes, tracks duration via progress counters. Includes arrival, task work, charging, idle logic, collision/wait/re-pathing logic.
    *   [ ] Implement Public Control methods: `startSimulation()`, `pauseSimulation()`, `resumeSimulation()`, `resetSimulation()`, `setSpeedFactor(factor: number)`. These methods primarily manage the `simulationStatus` in `SimulationStateService`, start/stop the `setInterval`, and potentially trigger initial assignment (`startSimulation`).
    *   [ ] Write comprehensive unit tests for `SimulationEngineService.step()` and control methods, mocking dependencies.
*   **[ ] (Est: 30-60 min) B3.7: Simulation Control API Endpoints (Code + Integration Tests)**
    *   [ ] In `packages/backend/src/controllers/simulationController.ts` / `packages/backend/src/routes/simulationSetupRoutes.ts`:
        *   [ ] Implement `POST /api/simulation/control/start` (calls `simulationEngineService.startSimulation()`).
        *   [ ] Implement `POST /api/simulation/control/pause` (calls `simulationEngineService.pauseSimulation()`).
        *   [ ] Implement `POST /api/simulation/control/resume` (calls `simulationEngineService.resumeSimulation()`).
        *   [ ] Implement `POST /api/simulation/control/reset`:
            *   [ ] `simulationEngineService.pauseSimulation()` (if running).
            *   [ ] `simulationStateService.resetSimulationSetup()`.
        *   [ ] Implement `POST /api/simulation/control/speed`.
    *   [ ] Write integration tests for these control endpoints (mock underlying services where necessary to check calls).

## Phase 4: WebSocket Integration (Est: 3-6 hours)

### Iteration 9: Backend WebSocket Setup & Broadcasting (Est: 1.5-3 hours)
*   **[ ] (Est: 1-2 hours) B4.1: WebSocketManager Service (Backend)**
    *   [ ] Install `socket.io` in `packages/backend`.
    *   [ ] Create `packages/backend/src/services/webSocketManager.ts`.
    *   [ ] Implement `WebSocketManager` class with methods for broadcasting (`broadcastSimulationUpdate`, `broadcastSimulationEnded`, `broadcastError`, `broadcastInitialStateToAll`).
    *   [ ] In `packages/backend/src/index.ts` (or where your HTTP server is created), initialize `socket.io` server and attach it to the HTTP server. Pass the `simulationStateService` and potentially the `SimulationEngineService` instances to the `WebSocketManager` constructor.
    *   [ ] Handle `connection` event in `WebSocketManager`: Get full state from `simulationStateService` and emit `initial_state` to the *specific connected client*.
*   **[ ] (Est: 30-60 min) B4.2: Integrate WebSocket Broadcasting Calls**
    *   [ ] Inject/Pass `WebSocketManager` instance (or a reference to it) into the `SimulationStateService` and `SimulationEngineService`.
    *   [ ] In `SimulationStateService`: Call `webSocketManager.broadcastInitialStateToAll()` (or similar event) after methods that significantly change the *setup state* (`addRobot`, `addTask`, `deleteRobot`, `deleteTask`, `resetSimulationSetup`, `initializeSimulation`, `setStrategy`). This keeps the frontend setup view in sync before the simulation starts.
    *   [ ] In `SimulationEngineService`:
        *   Call `webSocketManager.broadcastSimulationUpdate()` at the end of the `step()` method.
        *   Call `webSocketManager.broadcastSimulationEnded()` when the simulation end condition is met.
        *   Call `webSocketManager.broadcastInitialStateToAll()` after `startSimulation()` (initial state before first step) and `resetSimulation()`.

### Iteration 10: Frontend WebSocket Client (Est: 1.5-3 hours)
*   **[ ] (Est: 1-1.5 hours) F4.1: Frontend WebSocketService & Store Integration**
    *   [ ] Install `socket.io-client` in `packages/frontend`.
    *   [ ] Create `packages/frontend/src/services/webSocketService.ts`.
        *   [ ] Connect to backend WebSocket server using `socket.io-client`.
        *   [ ] Listen for `initial_state`, `simulation_update`, `simulation_ended`, `error_message` events.
        *   [ ] On receiving these events, dispatch corresponding actions to the frontend state management store (e.g., `simulationStore.setInitialState(payload)`, `simulationStore.updateSimulation(payload)`, etc.).
    *   [ ] Update `simulationStore.ts` with actions to handle these incoming WebSocket payloads.
*   **[ ] (Est: 30-60 min) F4.2: Frontend Dynamic Updates**
    *   [ ] Ensure the Frontend components (`GridDisplay`, `InfoPanel`, etc.) use state from `simulationStore` and automatically re-render when the store is updated by the WebSocket service.
    *   [ ] Display `simulationTime` and basic metrics from the `simulation_update` payload in the UI.

## Phase 5: Frontend Polish & Control Panel (Est: 3-6 hours)

### Iteration 11: Enhanced Visuals (Est: 1.5-3 hours)
*   **[ ] (Est: 30-60 min) F5.1 (Partial): Robot Icon Assets**
    *   [ ] Add 6-7 robot PNGs to `packages/frontend/public/assets/robots/`.
    *   [ ] Update `Robot` interface in `common` if `iconType` needs to be more specific (e.g., path to icon). `SimulationStateService.addRobot` should cycle through these or allow frontend to specify.
    *   [ ] `GridDisplay` renders the correct robot icon based on `robot.iconType`.
*   **[ ] (Est: 1-1.5 hours) F5.1 (Partial) & F5.2: Robot Movement Animation & Task Visuals**
    *   [ ] Implement smooth robot movement animation in `GridDisplay` (CSS transitions or simple tweening) based on received `currentLocation` updates.
    *   [ ] Display low battery indicator on robot icon (e.g., small red dot if `battery < LOW_BATTERY_THRESHOLD`).
    *   [ ] Visual for tasks (dot/icon).
    *   [ ] Spinning cogwheel animation for `in_progress` tasks triggered by status change.
*   **[ ] (Est: 30-60 min) F5.3: Information Display Panel**
    *   [ ] Create `packages/frontend/src/components/InfoPanel.tsx`.
    *   [ ] List robots: ID/icon, battery (%), status, current target (task ID or "Charger @ (x,y)").

### Iteration 12: Control Panel (Est: 1.5-3 hours)
*   **[ ] (Est: 1.5-3 hours) F5.4: ControlPanel Component & API Calls**
    *   [ ] Create `packages/frontend/src/components/ControlPanel.tsx`.
    *   [ ] Add "Start", "Pause", "Resume", "Reset", "Slower", "Faster" buttons.
    *   [ ] Wire buttons to call backend control APIs (defined in Iteration 8) via `apiService.ts`.
        *   `apiService.startSimulationCtrl()`, `pauseSimulationCtrl()`, etc.
    *   [ ] UI state of control buttons should reflect the simulation status (`idle`, `running`, `paused`) received via WebSocket and stored in the frontend state.

## Phase 6: Finalizing & Metrics Storage (Est: 2-4 hours)

### Iteration 13: Metrics, Supabase Saving, & Error Handling (Est: 2-4 hours)
*   **[ ] (Est: 1-1.5 hours) B6.1: Storing Simulation Results in Supabase**
    *   [ ] Define `simulation_results` table schema in Supabase (if not done in P0.4).
    *   [ ] `SupabaseService`: Add `saveSimulationResult(resultData)`.
    *   [ ] `SimulationEngineService`: On simulation end, call `saveSimulationResult` after calculating final metrics.
    *   [ ] Define key metrics (Total Time, Total Recharges) calculation logic within `SimulationEngineService` (e.g., add a `getMetrics()` method or calculate them when simulation ends). `Total Recharges` needs a counter updated in `SimulationEngineService.step()` whenever a robot *finishes* charging.
*   **[ ] (Est: 1-1.5 hours) B6.2 & F-Error: Error Handling Improvements**
    *   [ ] Backend Controllers: Enhance error handling (try-catch, specific HTTP status codes, JSON error messages).
    *   [ ] Backend Services (Engine, Assignment, etc.): Use error logging. For critical errors preventing simulation progress, emit `error_message` via `WebSocketManager`.
    *   [ ] Frontend: Implement a mechanism (e.g., toast notifications, dedicated error area) to display error messages received via API responses or WebSocket `error_message` events.
*   **[ ] (Est: Ongoing) B6.3: Comprehensive Testing**
    *   [ ] Review and add missing unit tests for all new/modified backend services (`SimulationStateService.advanceRobotAlongPath`, `SimulationEngineService`, `TaskAssignmentService`, `WebSocketManager`, `SupabaseService.saveSimulationResult`).
    *   [ ] Review and add missing integration tests for new backend routes (`/simulation/control/*`).
    *   [ ] Write frontend component tests (React Testing Library) for new UI pieces (`GridDisplay` visuals, `InfoPanel`, `ControlPanel`) and their interaction with the store/API service.
    *   [ ] Plan and (optionally) implement E2E tests covering the full simulation flow (setup, start, observe, finish, reset).
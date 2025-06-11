# Robot Simulation Project - Single Controller Feature TODO

This document outlines the steps to modify the existing simulation to allow only one connected client to control the simulation setup and runtime, while other connected clients can only observe. Control will be managed using WebSocket connection IDs (`socket.id`) and will transfer to another client if the current controller disconnects.

**Note:** This implementation uses WebSocket IDs for client identification. It **does NOT** include traditional user authentication with email/password or user accounts. Each connected browser instance is treated as a distinct "client" identified by its temporary `socket.id`.

## Phase X: Implement Single Controller Logic

This phase adds the necessary logic to track the controller, authorize actions, handle disconnects, and update the UI accordingly. It builds upon the completed Phase 0, 1, 2 (Backend State & Setup APIs), 3 (Backend Engine & Core Logic), 4 (WebSocket Integration), and 5 (Frontend Polish & Control Panel).

### Iteration 1: Backend Controller Tracking & Broadcast

*   **[ ] (Est: 1-1.5 hours) X1.1: SimulationStateService - Track Controller ID**
    *   [ ] In `packages/backend/src/services/simulationStateService.ts`:
        *   Add a new private property: `private controllerClientId: string | null = null;`
        *   Add a public getter: `getControllerClientId(): string | null`.
        *   Add a public setter: `setControllerClientId(clientId: string | null): void`. Log this change.
*   **[ ] (Est: 1.5-2.5 hours) X1.2: WebSocketManager - Manage Controllers**
    *   [ ] In `packages/backend/src/services/webSocketManager.ts`:
        *   Add a private property to store connected clients, maybe mapping socket ID to something if needed later, but for now, just keep a list or rely on `io.sockets.sockets`. Let's use a simple set: `private connectedClientIds: Set<string> = new Set();`.
        *   Modify the `io.on('connection', ...)` handler:
            *   Add the new `socket.id` to `connectedClientIds`.
            *   **Initial Control Assignment Logic:** If `simulationStateService.getControllerClientId()` is currently `null` (meaning no controller is assigned), call `simulationStateService.setControllerClientId(socket.id)`.
            *   Call `broadcastInitialStateToAll()` *after* setting the controller ID if it was just assigned. Ensure `initial_state` payload includes the `controllerClientId` (see X1.3).
        *   Implement the `socket.on('disconnect', ...)` handler *inside* the connection handler:
            *   Remove `socket.id` from `connectedClientIds`.
            *   **Controller Disconnect Logic:** If `socket.id` was the current `simulationStateService.getControllerClientId()`:
                *   Call `simulationStateService.setControllerClientId(null)`.
                *   **Find New Controller:** If there are still clients in `connectedClientIds`, select one to be the new controller (e.g., `const newControllerId = this.connectedClientIds.values().next().value;`).
                *   Call `simulationStateService.setControllerClientId(newControllerId)`.
                *   Log the controller transfer.
                *   Call `broadcastInitialStateToAll()` to inform all remaining clients of the controller change.
*   **[ ] (Est: 30-60 min) X1.3: WebSocketManager - Include Controller ID in Broadcasts**
    *   [ ] In `packages/backend/src/services/webSocketManager.ts`:
        *   Modify the payload sent by `broadcastInitialStateToAll()` and `broadcastSimulationUpdate()` to include the current `simulationStateService.getControllerClientId()`.
        *   Payloads might look like:
            ```json
            {
              // ... existing state (grid, robots, tasks, simTime, metrics, status, strategy)
              "controllerClientId": "string" | null
            }
            ```
*   **[ ] (Est: 1-1.5 hours) X1.4: Backend Unit Tests for WebSocketManager Control Logic**
    *   [ ] Write unit tests for `WebSocketManager` focusing on:
        *   Assigning the first client as controller on connect.
        *   Assigning controller on subsequent connects if none exists.
        *   Not changing controller on connect if one already exists.
        *   Handling controller disconnect and transferring control to another connected client.
        *   Handling controller disconnect when *no other* clients are connected (controller becomes null).
        *   Handling non-controller disconnect (controller remains the same).
        *   Verify broadcast payloads include the correct `controllerClientId`.
        *   *Mock `SimulationStateService` methods (`getControllerClientId`, `setControllerClientId`, `get...State`) and `socket.io` server/socket emissions.*

### Iteration 2: Backend Control API Authorization

*   **[ ] (Est: 1.5-2.5 hours) X2.1: Link HTTP Request to Client ID**
    *   [ ] **Frontend Change (Temporarily):** In `packages/frontend/src/services/apiService.ts`, modify the functions that make *control* API calls (`setupSimulationApi`, `placeRobotApi`, `placeTaskApi`, `selectStrategyApi`, `resetSetupApi`, `startSimulationCtrl`, `pauseSimulationCtrl`, `resumeSimulationCtrl`, `resetSimulationCtrl`, `setSpeedFactorCtrl`).
        *   Get the current client's `socket.id` (you'll need to pass the socket instance or its ID to `apiService`).
        *   Include this `socket.id` in the body of the POST requests or as a custom header (body is simpler for now). Example: `send({ location, iconType, clientId: mySocketId })`.
    *   [ ] **Backend Middleware/Helper:** Create a helper function or middleware in `packages/backend/src/middleware/` or `packages/backend/src/utils/` to extract the `clientId` from the request body/header.
*   **[ ] (Est: 1.5-2.5 hours) X2.2: Implement Authorization Checks in Controllers**
    *   [ ] In `packages/backend/src/controllers/simulationController.ts`:
        *   Modify all control endpoint handlers (`setupSimulation`, `placeRobot`, `placeTask`, `selectStrategy`, `resetSetupEndpoint`, `startSimulation`, `pauseSimulation`, `resumeSimulation`, `resetSimulation`, `setSpeed`).
        *   Use the helper from X2.1 to get the `clientId` from the request.
        *   Get the current `controllerClientId` from `simulationStateService.getControllerClientId()`.
        *   If `controllerClientId` is not `null` AND `clientId` from request does NOT match `controllerClientId`:
            *   Return a 403 Forbidden response: `res.status(403).json({ error: 'Forbidden: Only the controller can perform this action' }); return;`
        *   Only proceed with the original controller logic if the check passes or if `controllerClientId` is `null`.
*   **[ ] (Est: 1-1.5 hours) X2.3: Backend Integration Tests for Authorization**
    *   [ ] In `packages/backend/src/routes/simulationSetupRoutes.test.ts` and potentially new tests for control routes:
        *   Add tests for each control endpoint.
        *   Mock `simulationStateService.getControllerClientId()` to return a specific ID.
        *   Send requests with a `clientId` that *matches* the mock controller ID (expect 200 OK).
        *   Send requests with a `clientId` that *does not match* the mock controller ID (expect 403 Forbidden).
        *   Send requests when mock `controllerClientId` is `null` (expect 200 OK - assuming anyone can take control if none is set).
        *   *Mock `SimulationStateService` and the controller's dependencies as needed.*

### Iteration 3: Frontend UI Reflects Control Status

*   **[ ] (Est: 1-1.5 hours) X3.1: Frontend Store - Store Client's Own ID**
    *   [ ] In `packages/frontend/src/services/webSocketService.ts`:
        *   Store the client's own `socket.id` when the WebSocket connection is established.
        *   Add this ID to the frontend state management store (`simulationStore`).
    *   [ ] In `packages/frontend/src/store/simulationStore.ts`:
        *   Add a property `myClientId: string | null = null;`.
        *   Add an action `setMyClientId(id: string): void;`.
        *   Add a property `controllerClientId: string | null = null;` (to store the controller ID received from backend broadcasts).
        *   Modify actions that process incoming WebSocket payloads (`initial_state`, `simulation_update`) to update the `controllerClientId` in the store.
*   **[ ] (Est: 1.5-2.5 hours) X3.2: Frontend UI - Disable Controls Based on Controller Status**
    *   [ ] In `packages/frontend/src/components/ControlPanel.tsx`:
        *   Read `myClientId` and `controllerClientId` from `simulationStore`.
        *   Disable (grey out) all control buttons ("Start", "Pause", etc.) if `myClientId` is NOT equal to `controllerClientId` (and `controllerClientId` is not null).
    *   [ ] In `packages/frontend/src/components/GridDisplay.tsx` or its container:
        *   Read `myClientId` and `controllerClientId` from `simulationStore`.
        *   Disable the click handlers for placing robots/tasks if `myClientId` is NOT equal to `controllerClientId` (and `controllerClientId` is not null). Potentially change cursor or add an overlay.
*   **[ ] (Est: 30-60 min) X3.3: Frontend Info Panel - Display Controller**
    *   [ ] In `packages/frontend/src/components/InfoPanel.tsx` (or somewhere prominent):
        *   Display which client ID currently has control (the `controllerClientId` from the store). E.g., "Controller: [Client ID]". If `myClientId` matches, maybe display "You are the Controller".

### Iteration 4: Comprehensive Testing & Refinement

*   **[ ] (Est: 1-2 hours) X4.1: Backend E2E Scenario: Controller Disconnect & Transfer**
    *   [ ] Design an E2E test (or integration test if no E2E framework) that simulates:
        *   Client A connects -> becomes controller.
        *   Client B connects.
        *   Client A initiates an action (e.g., places robot) -> verify success.
        *   Client B initiates an action -> verify failure (403).
        *   Client A disconnects.
        *   Client B initiates an action -> verify success (B should now be the controller).
*   **[ ] (Est: 1-1.5 hours) X4.2: Frontend Component Tests for Control States**
    *   [ ] Write tests for `ControlPanel` and `GridDisplay` (placement logic) that verify buttons/clicks are correctly enabled/disabled based on mock `myClientId` and `controllerClientId` props/state.
*   **[ ] (Est: 1 hour) X4.3: Code Review and Refinement**
    *   [ ] Review the implemented logic across backend and frontend.
    *   [ ] Refactor for clarity, error handling, and consistency.
    *   [ ] Ensure robust handling of edge cases like no clients connected, single client connected, rapid connects/disconnects.


**Hardness of Implementation:**

Adding this functionality is **Moderately Hard / Medium Difficulty**.

*   It's not a simple addition; it requires touching multiple core parts of the system (Backend State, Backend WS, Backend API controllers, Frontend WS client, Frontend UI).
*   Linking the HTTP request back to the WebSocket client identity requires a specific pattern (embedding the ID in requests).
*   Handling disconnects and transferring control adds state management complexity on the backend (tracking connected clients and the controller).

It is harder than just adding a new service or endpoint, but not as hard as implementing the entire simulation engine from scratch.

**Authentication Method:**

This plan **does NOT include user authentication** (like email/password or user accounts). It uses the **WebSocket connection ID (`socket.id`)** as the temporary identifier for a client. This ID exists only for the duration of the WebSocket connection. When a client disconnects and reconnects, they get a *new* `socket.id` and would potentially become the controller if no one else is.

This is a simpler approach suitable for demonstrating the "one controller" concept without the significant overhead of building a full user authentication system and tying control/state to persistent user accounts.
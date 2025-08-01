# Real-Time Robot Task Simulation

A full-stack, multi-client web application that simulates a fleet of autonomous robots performing tasks on a 2D grid. This project features a robust Node.js backend managing all simulation logic, a dynamic React frontend for real-time visualization and control, and a PostgreSQL database for persistent storage of environments and user configurations.

**Live Demo:**  
https://robot-simulation-frontend.onrender.com  
## Table of Contents

- [Features](#features)
- [Technical Stack](#technical-stack)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Backend Details](#backend-details)
  - [Core Services](#core-services)
  - [API Endpoints](#api-endpoints)
- [Frontend Details](#frontend-details)
  - [State Management](#state-management)
  - [Real-time Updates](#real-time-updates)
- [Testing](#testing)

---

## Features

-   **Real-Time, Multi-Client Synchronization:** Multiple users can connect and observe the same simulation in real-time, with all state changes broadcast efficiently via WebSockets.
-   **Dynamic Simulation Environment:** Users can select from various grid layouts loaded from a PostgreSQL database. The setup is interactive, allowing placement of robots and tasks directly onto the grid.
-   **Complex Task Assignment Logic:** Implements two distinct strategies for assigning tasks to robots:
    -   **Nearest Available:** Robots proactively claim the closest unassigned task they can feasibly complete.
    -   **Round-Robin:** Tasks are assigned cyclically to available robots to ensure even workload distribution.
-   **Sophisticated Robot Behavior:**
    -   **A* Pathfinding:** Robots navigate complex environments with obstacles using the A* algorithm.
    -   **Collision Avoidance:** A yielding mechanism prevents robots from colliding, with ID-based priority resolution.
    -   **Deadlock Prevention:** Robots that are blocked for too long will attempt to find an alternative path.
    -   **Battery Management:** Robots consume battery for movement and tasks, and will autonomously seek out charging stations when low.
-   **User Authentication & Saved Setups:** Users can sign up and log in using a JWT-based authentication system. Authenticated users can save their simulation setups (grid, robot/task placements, strategy) and load them in future sessions.
-   **Data-Driven Environments:** Grid layouts are defined in simple text files and parsed by a Node.js seeding script, which populates the Supabase database.

## Technical Stack

-   **Backend:** Node.js, Express.js, TypeScript, Socket.IO
-   **Frontend:** React, Vite, TypeScript, Zustand (State Management), Socket.IO Client
-   **Database:** PostgreSQL (managed by Supabase)
-   **Shared:** A dedicated `common` package for shared TypeScript types between client and server.
-   **Testing:** Jest & Supertest for backend unit and integration testing.
-   **Deployment:** The backend is deployed as a Web Service and the frontend as a Static Site on **Render**.

## Architecture Overview

This project is structured as a **monorepo** to ensure type safety and code sharing between the client and server.

1.  **Backend (Authoritative Server):** The Node.js server is the single source of truth. It runs the entire simulation loop, manages all game state in memory for active sessions, handles all logic (pathfinding, task assignment, physics), and communicates with the Supabase database.
2.  **Frontend (Visualization & Control Client):** The React application is a "dumb" client. It is responsible for rendering the state received from the server and sending user commands (e.g., place robot, start simulation) to the backend via a RESTful API.
3.  **Database (Persistence Layer):** Supabase (PostgreSQL) is used to store persistent data that doesn't change during an active simulation, such as grid layouts and saved user setups.
4.  **WebSockets (Real-Time Layer):** Socket.IO is used to push state updates from the backend to all connected clients at a high frequency (60Hz), allowing for smooth, real-time visualization of the simulation.

## Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   A Supabase account (for your own instance)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies for all packages:**
    ```bash
    npm install
    ```

3.  **Setup Backend Environment:**
    -   Navigate to `packages/backend`.
    -   Create a `.env` file by copying `.env.example` (if provided) or creating a new one.
    -   Populate it with your Supabase project URL and keys:
        ```env
        SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
        SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
        PORT=3001
        ```

4.  **Setup Frontend Environment:**
    -   Navigate to `packages/frontend`.
    -   Create a `.env` file and add the backend URL:
        ```env
        VITE_BACKEND_URL=http://localhost:3001
        ```

5.  **Setup and Seed the Database:**
    -   In your Supabase project dashboard, run the SQL scripts located in `packages/backend/supabase/migrations/` to create the necessary tables.
    -   Run the seeding script from the `packages/backend` directory to populate the `grids` table with predefined layouts:
        ```bash
        cd packages/backend
        npm run seed
        ```

### Running the Application

1.  **Start the Backend Server:**
    ```bash
    # From the root directory
    npm run dev -w packages/backend
    ```
    The backend will be running on `http://localhost:3001`.

2.  **Start the Frontend Development Server:**
    ```bash
    # From the root directory
    npm run dev -w packages/frontend
    ```
    The frontend will be available at `http://localhost:5173`.

3.  Open `http://localhost:5173` in your browser to use the application.

## Project Structure
/
├── packages/

│ ├── backend/ # Node.js, Express, Socket.IO Server

│ │ ├── src/

│ │ │ ├── controllers/

│ │ │ ├── services/ # Core logic (simulation, pathfinding, etc.)

│ │ │ ├── routes/

│ │ │ └── ...

│ │ ├── scripts/ # Database seeding scripts

│ │ └── ...

│ ├── common/ # Shared TypeScript types and constants

│ └── frontend/ # React, Vite Client

│ ├── src/

│ │ ├── components/

│ │ ├── services/ # API and WebSocket services

│ │ ├── store/ # Zustand state management

│ │ └── ...

└── package.json # Root package.json for monorepo workspaces
## Backend Details

### Core Services

-   **`SimulationStateService`**: Manages the in-memory state of an active simulation (grid, robots, tasks, time).
-   **`SimulationEngineService`**: Contains the main `step()` function and game loop (`setInterval`), orchestrating all actions within a single simulation tick.
-   **`TaskAssignmentService`**: Implements the logic for the "Nearest Available" and "Round-Robin" strategies.
-   **`PathfindingService`**: A standalone service providing A* pathfinding on the current grid.
-   **`WebSocketManager`**: Centralizes all Socket.IO logic for broadcasting state to clients.
-   **`SupabaseService`**: Handles all interactions with the PostgreSQL database for fetching grids and managing user setups.

### API Endpoints

-   **`GET /api/grids`**: Fetches all available grid layouts.
-   **`POST /api/simulation/setup`**: Initializes a simulation with a specific grid.
-   **`POST /api/simulation/placeRobot`**: Adds a robot to the current setup.
-   **`POST /api/simulation/control/start`**: Starts the simulation engine loop.
-   **`POST /api/setups`**: (Authenticated) Saves the current setup for the logged-in user.
-   ...and other endpoints for setup and control.

## Frontend Details

### State Management

-   **Zustand** is used for global client-side state management. The store (`simulationStore.ts`) holds all data received from the backend via WebSockets,
     as well as UI-specific state like the current placement mode. Components subscribe to this store for reactive updates.

### Real-time Updates

-   The **`webSocketService.ts`** handles the connection to the backend server. It listens for events like `initial_state`,
   `simulation_update`, and `simulation_ended` and calls actions on the Zustand store to keep the client's state synchronized with the server's authoritative state.

## Testing

-   The backend includes a suite of **unit tests** for individual services (e.g., pathfinding, task assignment) and **integration tests** for the API routes using **Jest** and **Supertest**.
    This ensures core logic is correct and APIs adhere to their contracts. Mocks are used extensively to isolate components during testing.
🔢 Step 1: Row Reduction
For each row:

Find the smallest element.

Subtract it from every element in that row.

➡️ This ensures at least one zero per row.

🔢 Step 2: Column Reduction
For each column:

Find the smallest element.

Subtract it from every element in that column.

➡️ Now there’s at least one zero per column as well.

🔢 Step 3: Star Zeros + Cover Columns with Starred Zeros
Star zeros (★):

For each row, go left to right.

If you find a zero AND there’s no other starred zero in the same column, star it.

Cover all columns that contain a starred zero (draw vertical lines).

If the number of covered columns == n → ✅ you're done (go to Step 6: extract assignment).

Else → ❌ not enough assignments yet → go to Step 4.

🔄 Step 4: Find and Prime Uncovered Zeros
Loop over the matrix to find uncovered zeros (i.e., not in covered rows or columns).

When you find one:

Prime it (mark with ′ or ⍟).

If there’s no starred zero in the same row:

✅ This zero will start an alternating path (go to Step 5).

Else:

Cover the row.

Uncover the column containing the starred zero in that row.

Continue.

🔁 Step 5: Alternating Path of Primes and Stars
Let’s say you found a primed zero in position Z0.

Alternating path: a sequence of positions like:

scss
Copy
Edit
Z0 (primed)
Z1 (starred in same column as Z0’s row)
Z2 (primed in Z1’s row)
Z3 (starred in Z2’s column)
...
→ this alternates: prime → star → prime → star ...

Once built:

Unstar all the starred zeros in the path.

Star all the primed zeros.

Clear all primes.

Uncover all rows and columns.

Go back to Step 3 and try again.

🔁 Step 4 and 5 Loop
Repeat Steps 3 → 4 → 5 until the number of columns with starred zeros == n.

🧮 Step 6: Extract Optimal Assignment
From the final matrix:

Each row should have exactly one starred zero.

That zero indicates the optimal assignment for that row (worker → task).

🎯 Clarifying: What is an Alternating Path?
It’s a zigzag chain of starred and primed zeros that helps us swap assignments to open up a new assignment possibility.

Let’s break it down:

You start with a primed zero (potential new assignment).

Follow its column to find a starred zero (conflicting current assignment).

Then follow that starred zero's row to another primed zero.

Repeat until no starred zero is found in a primed zero’s row — now you’ve reached the end of the path.

This path lets you:

Free up an assignment by removing one star.

Add a new star at the beginning.

Shift the structure to move closer to optimal.


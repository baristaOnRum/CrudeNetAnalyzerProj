# Project Tasks Directory

This document summarizes all compiled and configured tasks across the workspace, organized by the application or tool they pertain to.

## Gradle

These build tasks are defined and registered within the [build.gradle](file:///c:/Users/Sebastian/Documents/netAnalyzer/build.gradle) file.

* **`npmBuild`**
  * **Command**: Runs `npm run build` in the `frontend` directory using the system shell.
  * **Description**: Compiles the frontend application using npm.
* **`cleanStatic`**
  * **Command**: Deletes the `src/main/resources/static` directory.
  * **Description**: Cleans the Spring Boot static resources folder to prevent stale assets.
* **`copyFrontend`**
  * **Command**: Copies the compiled assets from `frontend/dist` to `src/main/resources/static`.
  * **Description**: Copies the compiled frontend assets to the Spring Boot static resources folder. (Depends on `npmBuild` and `cleanStatic`).
* **`stopServer`**
  * **Command**: Runs shell commands to find and terminate processes listening on port 8080.
  * **Description**: Stops any running web server process on port 8080 to prevent address-already-in-use errors.
* **`startServer`**
  * **Command**: Runs the `bootRun` task.
  * **Description**: Starts the Spring Boot web server and pipes output to the console. (Depends on `bootRun`).
* **`bootRun`** (Spring Boot Plugin Task)
  * **Command**: Runs the main class of the Spring Boot application.
  * **Description**: Runs the backend server process. (Configured to depend on `stopServer`).
* **`test`** (Built-in Java Task)
  * **Command**: Executes backend unit and integration tests using JUnit 5.
  * **Description**: Runs all automated tests for the backend.

---

## VS Code

These tasks are defined in the workspace configurations file [.vscode/tasks.json](file:///c:/Users/Sebastian/Documents/netAnalyzer/.vscode/tasks.json).

* **`npm build`**
  * **Command**: `npm run build` (using npm task type in the `frontend` directory).
  * **Description**: Compiles the frontend application using npm and Vite.
* **`Copy Compiled Application (Shell)`**
  * **Command**: 
    * **Windows**: `Remove-Item -Path src/main/resources/static/* -Recurse -Force -ErrorAction SilentlyContinue; Copy-Item -Path frontend/dist/* -Destination src/main/resources/static -Recurse -Force`
    * **macOS/Linux**: `rm -rf src/main/resources/static/* && cp -R frontend/dist/* src/main/resources/static/`
  * **Description**: Direct shell commands to clear existing static files and copy compiled outputs.
* **`Copy Compiled Application (Gradle)`**
  * **Command**: `.\\gradlew.bat copyFrontend` (Windows) or `./gradlew copyFrontend` (macOS/Linux).
  * **Description**: Executes the Gradle wrapper task `copyFrontend` to build and copy assets.

---

## IntelliJ IDEA

These run configurations are stored as shared XML configurations inside the `.idea/runConfigurations` folder.

* **`npm build`**
  * **File Link**: [npm_build.xml](file:///c:/Users/Sebastian/Documents/netAnalyzer/.idea/runConfigurations/npm_build.xml)
  * **Command**: Runs the `build` script defined in [package.json](file:///c:/Users/Sebastian/Documents/netAnalyzer/frontend/package.json) using IntelliJ's built-in npm tool support.
  * **Description**: Compiles the web application with npm.
* **`Copy Compiled Application (Gradle)`**
  * **File Link**: [Copy_Compiled_Application.xml](file:///c:/Users/Sebastian/Documents/netAnalyzer/.idea/runConfigurations/Copy_Compiled_Application.xml)
  * **Command**: Invokes the `copyFrontend` task using the integrated Gradle runner.
  * **Description**: Executes the custom Gradle copy task to copy compiled assets into `src/main/resources/static`.

---

## Frontend (NPM Scripts)

These scripts are defined inside the [package.json](file:///c:/Users/Sebastian/Documents/netAnalyzer/frontend/package.json) configuration for the React frontend application.

* **`dev`**
  * **Command**: `vite --port=3000 --host=0.0.0.0`
  * **Description**: Launches the Vite local development server with Hot Module Replacement (HMR).
* **`build`**
  * **Command**: `vite build`
  * **Description**: Compiles and bundles the TypeScript and React files into a production-ready `dist` folder.
* **`preview`**
  * **Command**: `vite preview`
  * **Description**: Serves the built assets locally to preview production build behavior.
* **`clean`**
  * **Command**: `rm -rf dist server.js`
  * **Description**: Deletes compiled assets and temporary server files.
* **`lint`**
  * **Command**: `tsc --noEmit`
  * **Description**: Runs TypeScript type checking compiler without writing build outputs.

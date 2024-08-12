# AMRIT - Common-UI

As registration is a common process across multiple AMRIT modules, registration page needs to be configurable based on the service line and project. Providing a framework that makes it easier to modify and set up fields on the user interface (UI) for data collecting on service lines for MMU, HWC, and telemedicine. The system has to possess the ability to change according to certain project specifications, facilitating the easy customization of data fields to fulfil the distinct requirements of every project within these service lines. 

## Features

* **Registration Page**: This page allows the user to create new beneficiaries and edit the data of existing beneficiaries. User can collect and submit personal information, Location Information, Other Information of beneficiaries. User can generate/download ABHA card in registration page.


## Building From Source

This microservice is developed using Java and the Spring Boot framework, with MySQL as the database.

### Prerequisites

Ensure that the following prerequisites are met before building the MMU service:

* JDK 17
* Maven
* NPM/YARN
* Spring Boot v2
* MySQL

### Installation

To install the MMU module, please follow these steps:

1. Clone the repository to your local machine.
2. Install the dependencies and build the module:
   - Run the command `npm install`.
   - Run the command `npm run build`.
   - Run the command `mvn clean install`.
   - Run the command `npm start`.
3. Open your browser and access `http://localhost:4200/#/login` to view the login page of module.

### Building from source

1. To build deployable war files
```bash
mvn -B package --file pom.xml -P <profile_name>
```

The available profiles include dev, local, test, and ci.
Refer to `src/environments/environment.ci.template` file and ensure that the right environment variables are set for the build.

Packing with `ci` profile calls `build-ci` script in `package.json`.
It creates a `environment.ci.ts` file with all environment variables used in the generated build.

## Usage

All the features of the MMU service are exposed as REST endpoints. Please refer to the Swagger API specification for detailed information on how to utilize each feature.

The MMU module offers comprehensive management capabilities for your application.

### Initializing Submodule `Common-UI`

To initialize the `Common-UI` submodule, follow these steps:

To initialize the `Common-UI` submodule, follow these steps:

1. Clone the `mmu-ui` project:
   ```bash
   git clone https://github.com/PSMRI/MMU-UI

2. Navigate to the project directory and pull the latest changes from the develop branch
   cd mmu-ui
   git checkout develop
   git pull origin develop

3. Open the integrated terminal for the common-ui submodule and initialize it

   cd Common-UI
   git init
   git remote add origin https://github.com/PSMRI/Common-UI
   git submodule update --init --recursive

4. Check the available branches and switch to the develop branch

   git branch
   git checkout develop
   git pull origin develop
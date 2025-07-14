# ShipIT - Decentralized Delivery Platform
![shipit idea image](https://github.com/user-attachments/assets/b3dcb942-7f44-4e4b-86ae-70439577d504)

ShipIT is a full-stack decentralized application that facilitates a secure and transparent parcel delivery service using a blockchain-based escrow system. The platform connects senders, carriers, and receivers, ensuring that payments are held in escrow and released only upon successful delivery.

## Features

-   **Create Shipments:** Senders can create new shipment requests, specifying the pickup and delivery locations, item details, and the delivery fee.
-   **Escrow System:** The delivery fee is held in a smart contract escrow until the receiver confirms the delivery, ensuring a trustless transaction.
-   **Driver Dashboard:** Drivers can view a list of available shipments, accept jobs, and manage their ongoing deliveries.
-   **Sender Dashboard:** Senders can track the status of their shipments and confirm deliveries to release the payment to the driver.
-   **Real-time Tracking:** The platform provides real-time updates on the status of each shipment, from creation to delivery.
-   **Secure Payments:** All transactions are handled by the `ParcelEscrow.sol` smart contract on the blockchain, providing a secure and transparent payment system.

## Technology Stack

This project is built with a modern, full-stack architecture that includes a frontend, backend, and a blockchain component for secure transactions.

### Frontend

The frontend is a responsive and interactive user interface built with:

-   **React:** A JavaScript library for building user interfaces.
-   **Vite:** A fast build tool that provides a quicker and leaner development experience.
-   **TypeScript:** A statically typed superset of JavaScript that adds type safety.
-   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
-   **React Router:** For declarative routing in a React application.
-   **Leaflet:** An open-source JavaScript library for interactive maps.
-   **Ethers.js:** To interact with the Ethereum blockchain and smart contracts.
-   **Framer Motion:** For animations and transitions.

### Backend

The backend is a robust server powered by:

-   **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine.
-   **Express:** A minimal and flexible Node.js web application framework.
-   **TypeScript:** For type-safe backend code.
-   **Mongoose:** An ODM (Object Data Modeling) library for MongoDB and Node.js.
-   **MongoDB:** A NoSQL database for storing application data.
-   **Ethers.js:** To manage blockchain operations and interact with the smart contract.

### Blockchain

The core of the decentralized functionality is built with:

-   **Solidity:** The programming language used to write the smart contract.
-   **ParcelEscrow.sol:** A smart contract that manages the escrow of funds, ensuring secure and transparent transactions between parties.

## Architecture

The application follows a classic client-server architecture with a decentralized backend.

-   **Frontend (Client):** The React application provides the user interface for senders and drivers. It communicates with the backend via a REST API and interacts with the `ParcelEscrow.sol` smart contract through Ethers.js.
-   **Backend (Server):** The Node.js server exposes a REST API for the frontend to consume. It handles business logic, interacts with the MongoDB database, and communicates with the blockchain.
-   **Blockchain (Smart Contract):** The `ParcelEscrow.sol` smart contract is deployed on the blockchain and manages the lifecycle of each delivery, including the creation, acceptance, and completion of shipments, as well as the escrow and release of funds.

## API Endpoints

The backend provides the following API endpoints:

| Method | Endpoint                       | Description                               |
| ------ | ------------------------------ | ----------------------------------------- |
| POST   | `/api/parcels`                 | Create a new parcel                       |
| GET    | `/api/parcels/available`       | Get all available parcels                 |
| GET    | `/api/parcels/driver/:address` | Get all parcels for a specific driver     |
| GET    | `/api/parcels/sender/:address` | Get all parcels for a specific sender     |
| GET    | `/api/parcels/:id`             | Get a specific parcel by ID               |
| POST   | `/api/parcels/:id/accept`      | Accept a parcel                           |
| PUT    | `/api/parcels/:id/status`      | Update the status of a parcel             |
| PUT    | `/api/parcels/:id/release-funds`| Release the funds for a parcel            |
| POST   | `/api/users`                   | Create a new user                         |

## Smart Contract

The `ParcelEscrow.sol` smart contract is the core of the ShipIT platform. It provides the following functions:

-   `createDelivery()`: Creates a new delivery request and holds the delivery fee in escrow.
-   `acceptDelivery()`: Allows a driver to accept a delivery request.
-   `startTransit()`: Allows the driver to mark the package as in transit.
-   `confirmDelivery()`: Allows the sender to confirm the delivery and release the funds to the driver.
-   `cancelDelivery()`: Allows the sender to cancel a delivery and get a refund if the delivery has not been accepted by a driver.
-   `emergencyCancel()`: Allows the contract owner to cancel a delivery in case of an emergency.

## Getting Started

To get the project up and running locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd project-bolt-sb1-y9nu7bwi
    ```

2.  **Set up the backend:**

    ```bash
    cd backend
    npm install
    ```

    Create a `.env` file in the `backend` directory by copying the `.env.example` file and filling in the required environment variables (e.g., database connection string, private keys).

    ```bash
    npm run dev
    ```

3.  **Deploy the Smart Contract:**

    You will need to deploy the `ParcelEscrow.sol` smart contract to a local or test network. You can use a tool like Hardhat or Remix for this. Once deployed, you will need to update the contract address in the frontend and backend configuration.

4.  **Set up the frontend:**

    ```bash
    cd ../frontend
    npm install
    ```

    Create a `.env` file in the `frontend` directory and add the following environment variable:

    ```
    VITE_CONTRACT_ADDRESS=<your-contract-address>
    ```

    ```bash
    npm run dev
    ```

The application should now be running, with the frontend accessible at `http://localhost:5173` and the backend at the configured port.

## Contributing

Contributions are welcome! If you would like to contribute to the project, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with a descriptive commit message.
4.  Push your changes to your forked repository.
5.  Create a pull request to the main repository.



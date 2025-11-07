# SmartEarning Admin Panel

This project is a comprehensive admin dashboard to manage users, deposits, withdrawals, investment plans, and system settings for the SmartEarning platform. It features a React frontend and a Node.js/Express backend that connects to a MongoDB database.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- [Node.js](httpss://nodejs.org/) (v18 or later recommended)
- [npm](httpss://www.npmjs.com/) (usually comes with Node.js)
- A [MongoDB](httpss://www.mongodb.com/) database instance (either local or cloud-hosted via MongoDB Atlas).

## Backend Setup

The backend server is built with Node.js, Express, and Mongoose. All required dependencies are listed in the `package.json` file.

### 1. Install Dependencies

Navigate to the project's root directory in your terminal and run the following command to install both frontend and backend dependencies:

```bash
npm install
```

### 2. Configure Environment Variables

The backend requires a MongoDB connection string. Create a file named `.env` in the project's root directory and add your MongoDB connection URI to it:

**.env**
```
MONGODB_URI=your_mongodb_connection_string
```
Replace `your_mongodb_connection_string` with your actual MongoDB URI. For example: `mongodb://localhost:27017/smartearning` or a URI from MongoDB Atlas.

### 3. Run the Backend Server

To start the backend server, run the following command from the root directory:

```bash
npm run start
```

The server will start on port 3001 (or the port specified in your environment) and connect to your database. On its first run with an empty database, it will automatically seed it with initial mock data.

## Frontend Setup

The frontend is a React application built with Vite.

### Run the Frontend Development Server

To start the frontend development server, open a **new terminal window**, navigate to the project's root directory, and run:

```bash
npm run dev
```

This will start the Vite development server, and you can view the application in your browser at the local address provided (usually `http://localhost:5173`). The frontend is configured to proxy API requests to the backend server.

Now you have both the backend and frontend running!

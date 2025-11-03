const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001; // You can use any port that's not in use

// This is your mock data. For now, you can copy it directly here.
// Eventually, this will come from a real database.
const mockUsers = [
  { id: 1, username: 'john.doe', fullName: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890', walletBalance: 221.00, status: 'Active', /*...other fields*/ },
  { id: 2, username: 'jane.smith', fullName: 'Jane Smith', email: 'jane.smith@example.com', phone: '234-567-8901', walletBalance: 50.00, status: 'Active', /*...other fields*/ },
  // ...add the rest of your mock users
];

app.use(cors()); // Enable CORS for all routes

// This is your first API endpoint!
app.get('/api/users', (req, res) => {
  res.json(mockUsers);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

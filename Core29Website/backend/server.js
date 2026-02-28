const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Absolute path to frontend/pages
const frontendPath = path.join(__dirname, '../frontend/pages');

// Serve static files (CSS, JS, images inside pages folder)
app.use(express.static(frontendPath));

// Route for index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
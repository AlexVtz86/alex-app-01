const express = require("express");
const path = require("path");
<<<<<<< Updated upstream
const dataRoutes = require("./ROUTES/dataRoutes");

=======
const fileUpload = require("express-fileupload");
const {
  initializeDatabase,
  uploadCSV,
  fetchData,
  organizeData
} = require("./controllers/dataController");
const { router } = require("./ROUTES/dataRoutes");
// const { Pool } = require("pg");
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));

<<<<<<< Updated upstream
// Routes
app.use("/api", dataRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/table", (req, res) => {
  res.sendFile(path.join(__dirname, "public/table.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
=======
// Initialize database before setting up routes
initializeDatabase()
  .then(() => {
    // Routes
    app.post("/api/upload", uploadCSV);
    app.get("/api/data", fetchData);
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "public/index.html"));
    });
    // Endpoint to handle the query from React
    app.post("/", organizeData);
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

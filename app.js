const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const {
  initializeDatabase,
  uploadCSV,
  fetchData,
} = require("./controllers/dataController");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Static file serving
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));

// Initialize database before setting up routes
initializeDatabase()
  .then(() => {
    // Routes
    app.post("/api/upload", uploadCSV);
    app.get("/api/data", fetchData);

    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "public/index.html"));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

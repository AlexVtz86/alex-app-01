const express = require("express");
const path = require("path");
const dataRoutes = require("./ROUTES/dataRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));

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

const express = require("express");
const router = express.Router();
const {
  uploadCSV,
  fetchData,
  updateData,
} = require("../controllers/dataController");

router.post("/upload", uploadCSV);
router.get("/data", fetchData);
router.put("/data", updateData);

module.exports = router;

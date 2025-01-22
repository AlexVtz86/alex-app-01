const express = require("express");
const router = express.Router();
const {
  uploadCSV,
  fetchData,
  // updateData,
} = require("../controllers/dataController");

router.post("/upload", uploadCSV);
router.get("/data", fetchData);
// router.put("/data", updateData);
// router.get("/data/:id", (req, res) => {
//   res.send(`data organized by : ${req.params.id}`, organizeData);
// })
 

module.exports = { router };

// to create a dynamic parameters inside the router :
// to create different router methods with dynamic parameter: 
// the router.route method is a way to CHAIN TOGETHER  different http methods
// the "route.param" function :
// what are all the http methods ?
  //  router.route("/data/:id")
  //   .get((req, res) => {
  //      // fetch data by id
  //      res.send(data.filter(item => item._id === req.params.id));
  //    })
  //   .put((req, res) => {
  //      // update data by id
  //      const updatedData = data.map(item =>
  //        item._id === req.params.id? {...item, ...req.body} : item
  //      );
  //      data = updatedData;
  //      res.send(updatedData);
  //    })
  //   .delete((req, res) => {
  //      // delete data by id
  //      data = data.filter(item => item._id!== req.params.id);
  //      res.send(data);
  //   });

   
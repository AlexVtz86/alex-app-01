const csvParser = require("csv-parser");
const fs = require("fs");
const { Client } = require("pg");
const path = require("path");
const { debug } = require("console");

// Database connection configuration
const client = new Client({
  user: "alex",
  host: "localhost",
  database: "postgres",
  password: "alexadmin",
  port: 5432,
});

client
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => console.error("Connection error", err.stack));

//this is a function to upload a csv file to a database
const uploadCSV = (req, res) => { // two  variables are set for the request and response to and from
  // the server
  if (!req.files || !req.files.file) { // here we are making sure that the file exists
    // what do the "files" and "file" Properties here mean ?
    return res.status(400).send("No file uploaded.");
  }

  const uploadedFile = req.files.file; // declaration of a variable for to the "request file"
  const dataDir = path.join(__dirname, "data"); // declaration of a variable for the
  //directory to contain and "hold" the uploaded file
 
  // Ensure the data directory exists
  if (!fs.existsSync(dataDir)) { // in language - "if there is no data directory then create
    //one". this is done through a method of the "fs" module
     fs.mkdirSync(dataDir);
  }

  const filePath = path.join(dataDir, uploadedFile.name);  // declaration of a variable for
  //the path of the uploaded file. this is done through a method "join" of the "path" module
  //what does the property "name" mean here? 

  // Write the file to the data directory
  fs.writeFile(filePath, uploadedFile.data, (err) => { // taking the "filePath" and "uploadedFile"
    // variabels as function parameters and operating on them through the "writeFile" method of the
    // "fs" module and adding a callback function to handle an error 
    if (err) {
      console.error("File upload failed:", err);
      return res.status(500).send("Error uploading file");
    }
 
    // Process the CSV file
    const results = []; // an empty array to hold the results of the CSV processing
    fs.createReadStream(filePath) // operting on the "filePath" variable through the 
    // "createReadStream" method of the "fs" module. 
      .pipe(csvParser()) // what do the keywords "pipe" and "on" here mean
      // and how exactly the csvparser module operates on the "data" directory declared above ? 
      .on("data", (data) => results.push(data))
      .on("end", async () => { // an asynchronous function with try and catch blocks
        // what does the string "end" mean here ?
        try { 
          for (const row of results) { // this is an attempt to loop through the "results"
            // array declared above and use a postgresql query afrer establishing a conneciton
            // to the database and to "inject" the results into it
            const query = "INSERT INTO mock_data_root (first_name) VALUES ($1)"; // THE QUERY  
            const values = [row.first_name]; // the values of the csv file
            await client.query(query, values); 
          }
          res.send("CSV file processed and data saved to database"); // here we are 
          // "finishing up" the function with the "res" parameter. 
        } catch (err) { // this is the "catch" block to handle errors 
          console.error(err);
          res.status(500).send("Error saving data to database");
        }
      });
  });
};

const fetchData = async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM mock_data_root");
    console.log("recieved!");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data from database");
  }
};

const updateData = async (req, res) => {
  const { id, first_name } = req.body;
  try {
    const query = "UPDATE mock_data_root SET first_name = $1 WHERE id = $2";
    const values = [first_name, id];
    await client.query(query, values);
    res.send("Data updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating data");
  }
};

module.exports = { uploadCSV, fetchData, updateData };


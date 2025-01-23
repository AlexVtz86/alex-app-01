const csvParser = require("csv-parser");
const fs = require("fs");
const { Client, Pool } = require("pg");
const path = require("path");
const { debug } = require("console");
const dbConfig = require("../db_config.json");
const { query } = require("express");
const Query = require("mysql/lib/protocol/sequences/Query");


let client = null;

const initializeDatabase = async () => {
  client = new Client({
    user: "myapp",
    host: "localhost",
    database: "mydatabase",
    password: "123456",
    port: 5432,
  });

  try {
    await client.connect();
    console.log("Connected to the database");
    await createTableIfNotExists();
  } catch (err) {
    console.error("Failed to connect to the database:", err);
    throw err;
  }
};

const createTableIfNotExists = async () => {
  const dropTableQuery = `DROP TABLE IF EXISTS "${dbConfig.tableName}"`;
  const columnsDefinition = dbConfig.columns
    .map((column) => `"${column.name}" ${column.type}`)
    .join(", ");

  const createTableQuery = `
    CREATE TABLE "${dbConfig.tableName}" (
      id SERIAL PRIMARY KEY,
      ${columnsDefinition}
    )
  `;

  try {
    await client.query(dropTableQuery);
    console.log(`Table ${dbConfig.tableName} dropped if it existed`);
    await client.query(createTableQuery);
    console.log(`Table ${dbConfig.tableName} created`);
  } catch (err) {
    console.error("Error creating table:", err);
    throw err;
  }
};


const uploadCSV = async (req, res) => { //function for handling csv file upload
  if (!req.files || !req.files.file) {
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

  try { // section for handling csv parsing 
    await fs.promises.writeFile(filePath, uploadedFile.data); //  AWAITING

    const results = [];  // results for processing CSV file
    // Read the CSV file, parse it, and extract the relevant data
    let isFirstRow = true; // true if first row is first row of the CSV file
    //  then 
    await new Promise((resolve, reject) => { // AWAITING 
      fs.createReadStream(filePath) // method for reading the CSV file from the filesystem 
        .pipe(csvParser({ headers: dbConfig.originalNames })) //  method for writing the CSV file to the filesystem
        .on("data", (data) => { // method with a callback to be called WHEN the CSV file is BEING processed 
          if (isFirstRow) {
            isFirstRow = false;
            return; // Skip the first row (headers)
          }
          results.push(data);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const columnNames = dbConfig.columns.map((column) => column.name); // 
    const placeholders = columnNames
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    let inserted = 0;
    let errors = 0;

    for (const row of results) { // a loop on the newly creatd csv file object
      // that parsed the CSV file to extract the relevant data to the database
      // and ENSURE THAT THE VALUES OF THE FILE AND THE DATABASE MATCH EACH OTHER 
      const query = `
        INSERT INTO "${dbConfig.tableName}" ("${columnNames.join('", "')}")
        VALUES (${placeholders})
      `;
      const values = columnNames.map((col, index) => { // a section to handle conflicting values 
        const originalName = dbConfig.originalNames[index];
        if (col === "תאריך") { // if the column is named "date" : 
          if (!row[originalName]) return null;
          const date = new Date(row[originalName]); // create a new date object 
          if (isNaN(date.getTime())) {
            console.warn(`Invalid date for row:`, row);
            return null;
          }
          return date.toISOString();
        } else if (col === "נוטל_תרופות") {
          // Convert to boolean: true for "כן", false for anything else
          return row[originalName] === "כן";
        } else if (col === "סובל_מכאבים") {
          // Convert to boolean: true for "כן - סובל מכאבים כרוניים מתמשכים", false for anything else
          return row[originalName] === "כן - סובל מכאבים כרוניים מתמשכים";
        }
        return row[originalName] || null;
      });

      try {
        const result = await client.query(query, values); //  AWAITING
        if (result.rowCount === 1) {
          inserted++;
        }
      } catch (err) {
        console.error("Error inserting row:", err, "Row data:", row);
        errors++;
      }
    }

    res.send( 
      `CSV file processed. Inserted: ${inserted} records. Errors: ${errors}.` // count the number of inserted records and errors
    );
  } catch (err) {
    console.error("Error processing file:", err);
    res.status(500).send("Error processing file: " + err.message);
  }
};

const fetchData = async (req, res) => {  // function for fetching data FROM the database 
  try {

    const result = await client.query("SELECT * FROM mock_data_root");
    console.log("recieved!");
    res.json(result.rows);

    if (!client) {
      throw new Error("Database client is not initialized");
    }

    const mappedResults = result.rows.map((row) => {
      const mappedRow = {};
      dbConfig.columns.forEach((col, index) => {
        const originalName = dbConfig.originalNames[index];

        if (col.name === "נוטל_תרופות") {
          mappedRow["האם אתה נוטל תרופות קבועות באופן קבוע"] = row[col.name]
            ? "כן"
            : "לא"; 
        } else if (col.name === "סובל_מכאבים") {
          mappedRow["האם אתה סובל מכאבים כרוניים מתמשכים?"] = row[col.name] // 
            ? "כן - סובל מכאבים כרוניים מתמשכים"
            : "לא - אני לא סובל מכאבים כרוניים מתמשכים";
        } else {
          mappedRow[originalName] = row[col.name];
        }
      });
      return mappedRow;
    });
    res.json(mappedResults); //the data here is converted to JSON when sent to the frontend for presentation

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data from database");
  }
}; 

const organizeData = async (req, res) => {
  const { queryInput } = req.body;
  try {
    const result = await Pool.query(`SELECT * FROM "${dbConfig.tableName}" LIMIT 20`, [queryInput]);
    res.json(result.rows); // Send query results back to the frontend
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to execute query' });
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

// we can see that almost all the data transitions and manipulations in the code are happening through the JSON object file //
  
module.exports = { initializeDatabase, uploadCSV, fetchData, organizeData };

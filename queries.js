// const dbConfig = require("../db_config.json");
// const { Client } = require("pg");
// const { initializeDatabase } = require("./controllers/dataController");

// const db = initializeDatabase(dbConfig);

// steps to organize the data from the database 
// implement logic to order by ascending or descending order based on a particular parameter
// (age, name, phone, email, medications, etc...)


// const orderQuery = (`SELECT * FROM ${dbConfig.tableName} LIMIT 20`);

// // // You can also implement sorting by other parameters by replacing orderQuery with the following:

// // // const compareById = (a, b) => a.id - b.id;

// const organizeData = async () => {
//   try {
//     // const data = await fetchData(); // Fetch the data from the database
//     // data.sort(orderQuery); // Sort
//     orderQuery;
//     console.log("Data organized - first 20 entries.");
//   }
//   catch (err) {
//     console.error("Error organizing data:", err);
//   }
// }

// organizeData();


// app.get('/api/data', async (req, res) => {
//   const { sortBy, filterBy } = req.query; // Get query parameters
//   let query = 'SELECT * FROM Yarokale';

//   if (filterBy) query += ` WHERE column_name LIKE '%${filterBy}%'`;
//   if (sortBy) query += ` ORDER BY ${sortBy}`;

//   const result = await db.query(query);
//   res.json(result.rows); // Send as JSON
// });


// // organize();

// const organize = async (req, res) => {
//   // implement logic to organize the data from the database based on a particular parameter, such as age
//   try {
//     if (!client) {
//       throw new Error("Database client is not initialized");
//     }
//     const result = await client.query(
//       "SELECT * FROM Yarokale LIMIT 20",
//     );
//     console.log("data organized");
//     res.json(result.rows);
//   }
//   catch (err) {
//     console.error("Error organizing data:", err);
//     res.status(500).send("Error organizing data: " + err.message);
//   }
// }

// organize();


// // You can also implement sorting by other parameters by replacing orderQuery with the following:

// // const compareById = (a, b) => a.id - b.id;



// const organize = async () => {
//   const query2 = "SELECT * FROM Yarokale LIMIT 20";
//   try {
//   const result2 = await Client.query(query2);
//   const data = result2.rows;
//   console.log(data);
//   }
//   catch (error) {
//     console.error('Error executing query', error.stack);
//   }
// }

// organize(); // this function is just for testing purposes, to fetch the first 20 rows of the "Yarokale" table in the database //

// The "queries.js" file is responsible for organizing the data from the database, 
// implementing logic to order by ascending or descending order based on a particular parameter, 
// and providing functions for fetching data from the database.
 // This file should be imported and used in the main server.js file.
// For example, in the main server.js file, you can use the following code to fetch data and sort it:
 // const { fetchData } = require("./queries");
 // const data = await fetchData();
 // const sortedData = data.sort((a, b) => a.date.localeCompare(b.date));
// console.log(sortedData);

// const orderQuery = (`SELECT * FROM ${dbConfig.tableName} LIMIT 20`);

// document.getElementById("organize").addEventListener("submit", async() => {
//         try {
//             // const data = await fetchData(); // Fetch the data from the database
//             // data.sort(orderQuery); // Sort
//             orderQuery;
//             console.log("Data organized - first 20 entries.");
//         }
//         catch (err) {
//             console.error("Error organizing data:", err);
//         }
// }
// )


  
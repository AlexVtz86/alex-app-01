const csvParser = require("csv-parser");
const fs = require("fs");
const { Client } = require("pg");
const path = require("path");
const dbConfig = require("../db_config.json");

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

const uploadCSV = async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("No file uploaded.");
  }

  const uploadedFile = req.files.file;
  const dataDir = path.join(__dirname, "..", "data");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, uploadedFile.name);

  try {
    await fs.promises.writeFile(filePath, uploadedFile.data);

    const results = [];
    let isFirstRow = true;
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser({ headers: dbConfig.originalNames }))
        .on("data", (data) => {
          if (isFirstRow) {
            isFirstRow = false;
            return; // Skip the first row (headers)
          }
          results.push(data);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const columnNames = dbConfig.columns.map((column) => column.name);
    const placeholders = columnNames
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    let inserted = 0;
    let errors = 0;

    for (const row of results) {
      const query = `
        INSERT INTO "${dbConfig.tableName}" ("${columnNames.join('", "')}")
        VALUES (${placeholders})
      `;
      const values = columnNames.map((col, index) => {
        const originalName = dbConfig.originalNames[index];
        if (col === "תאריך") {
          if (!row[originalName]) return null;
          const date = new Date(row[originalName]);
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
        const result = await client.query(query, values);
        if (result.rowCount === 1) {
          inserted++;
        }
      } catch (err) {
        console.error("Error inserting row:", err, "Row data:", row);
        errors++;
      }
    }

    res.send(
      `CSV file processed. Inserted: ${inserted} records. Errors: ${errors}.`
    );
  } catch (err) {
    console.error("Error processing file:", err);
    res.status(500).send("Error processing file: " + err.message);
  }
};

const fetchData = async (req, res) => {
  try {
    if (!client) {
      throw new Error("Database client is not initialized");
    }

    const result = await client.query(
      `SELECT * FROM "${dbConfig.tableName}" ORDER BY id`
    );

    const mappedResults = result.rows.map((row) => {
      const mappedRow = {};
      dbConfig.columns.forEach((col, index) => {
        const originalName = dbConfig.originalNames[index];

        if (col.name === "נוטל_תרופות") {
          mappedRow["האם אתה נוטל תרופות קבועות באופן קבוע"] = row[col.name]
            ? "כן"
            : "לא";
        } else if (col.name === "סובל_מכאבים") {
          mappedRow["האם אתה סובל מכאבים כרוניים מתמשכים?"] = row[col.name]
            ? "כן - סובל מכאבים כרוניים מתמשכים"
            : "לא - אני לא סובל מכאבים כרוניים מתמשכים";
        } else {
          mappedRow[originalName] = row[col.name];
        }
      });
      return mappedRow;
    });

    res.json(mappedResults);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Error fetching data from database: " + err.message);
  }
};
module.exports = { initializeDatabase, uploadCSV, fetchData };

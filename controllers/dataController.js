const csvParser = require("csv-parser");
const fs = require("fs");
const { Client } = require("pg");
const path = require("path");
const dbConfig = require("../db_config.json");

let client = null;

const initializeDatabase = async () => {
  if (client) {
    return client;
  }

  client = new Client({
    user: "myapp",
    host: "localhost",
    database: "mydatabase",
    password: "123456",
    port: 5432,
  });

  try {
    await client.connect();
    console.log(`Connected to PostgreSQL database`);

    await createTableIfNotExists();
    console.log("Database setup complete");
    return client;
  } catch (err) {
    console.error("Connection error", err.stack);
    throw err;
  }
};

const createTableIfNotExists = async () => {
  const columnsDefinition = dbConfig.columns
    .map((column) => `"${column.name}" ${column.type}`)
    .join(", ");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS "${dbConfig.tableName}" (
      ${columnsDefinition}
    )
  `;

  try {
    await client.query(createTableQuery);
    console.log(`Table ${dbConfig.tableName} created or already exists`);
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
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser({ headers: dbConfig.columns.map((col) => col.name) }))
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    const columnNames = dbConfig.columns.map((column) => column.name);
    const placeholders = columnNames
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const updateSet = columnNames
      .map((col, index) => `"${col}" = EXCLUDED."${col}"`)
      .join(", ");

    let inserted = 0;
    let updated = 0;

    for (const row of results) {
      const query = `
        INSERT INTO "${dbConfig.tableName}" ("${columnNames.join('", "')}")
        VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET
          ${updateSet}
      `;
      const values = columnNames.map((col) => {
        if (col === "id") {
          return parseInt(row[col], 10) || null;
        }
        if (col === "תאריך") {
          return row[col] ? new Date(row[col]) : null;
        }
        if (col === "טלפון") {
          return row[col] ? BigInt(row[col].replace(/\D/g, "")) : null;
        }
        if (col === "לוקח תרופות" || col === "סובל מכאבים") {
          return row[col] === "כן" || row[col] === "true" || row[col] === "1";
        }
        return row[col] || null;
      });

      if (values[0] === null) {
        console.warn("Skipping row with invalid ID:", row);
        continue;
      }

      const result = await client.query(query, values);
      if (result.rowCount === 1) {
        if (result.command === "INSERT") {
          inserted++;
        } else {
          updated++;
        }
      }
    }

    res.send(
      `CSV file processed. Inserted: ${inserted}, Updated: ${updated} records.`
    );
  } catch (err) {
    console.error("Error processing file:", err);
    res.status(500).send("Error processing file: " + err.message);
  }
};

const fetchData = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
        id, 
        "תאריך", 
        "שם מלא", 
        "טלפון"::TEXT as "טלפון", 
        "אימייל", 
        "לוקח תרופות", 
        "סובל מכאבים", 
        "קופת חולים"
      FROM "${dbConfig.tableName}" 
      ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data from database");
  }
};

module.exports = { initializeDatabase, uploadCSV, fetchData };

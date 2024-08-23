const csvParser = require("csv-parser");
const fs = require("fs");
const { Client } = require("pg");
const path = require("path");

// Database connection configuration
const client = new Client({
  user: "myapp",
  host: "localhost",
  database: "mydatabase",
  password: "123456",
  port: 5432,
});

client
  .connect()
  .then(() =>
    console.log(
      `Connected to PostgreSQL database\n User: {client.user}\n Host: {client.host}\n Database: {client.database}\n Port: {client.port}`
    )
  )
  .catch((err) => console.error("Connection error", err.stack));

const uploadCSV = async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("No file uploaded.");
  }

  const uploadedFile = req.files.file;
  const dataDir = path.join(__dirname, "..", "data");

  // Ensure the data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, uploadedFile.name);

  try {
    // Write the file to the data directory
    await fs.promises.writeFile(filePath, uploadedFile.data);

    // Process the CSV file
    const results = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    // Insert data into database
    for (const row of results) {
      const query = `
          INSERT INTO mock_data (
            id, first_name, last_name, email, gender, ip_address
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            gender = EXCLUDED.gender,
            ip_address = EXCLUDED.ip_address
        `;
      const values = [
        row.id,
        row.first_name,
        row.last_name,
        row.email,
        row.gender,
        row.ip_address,
      ];
      await client.query(query, values);
    }

    res.send("CSV file processed and data saved to database");
  } catch (err) {
    console.error("Error processing file:", err);
    res.status(500).send("Error processing file: " + err.message);
  }
};

const fetchData = async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM mock_data ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data from database");
  }
};

const updateData = async (req, res) => {
  const { id, first_name } = req.body;
  try {
    const query = "UPDATE mock_data SET first_name = $1 WHERE id = $2";
    const values = [first_name, id];
    await client.query(query, values);
    res.send("Data updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating data");
  }
};

module.exports = { uploadCSV, fetchData, updateData };

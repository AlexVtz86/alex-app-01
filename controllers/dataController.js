const csvParser = require('csv-parser');
const fs = require('fs');
const { Client } = require('pg');
const path = require('path');

// Database connection configuration
const client = new Client({
  user: 'root',
  host: 'localhost',
  database: 'mydatabase',
  password: 'root',
  port: 5432, // Default PostgreSQL port
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Connection error', err.stack));


const uploadCSV = (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          const query = 'INSERT INTO your_table_name (field1, field2) VALUES ($1, $2)';
          const values = [row.field1, row.field2]; // Adjust fields based on your CSV structure
          await client.query(query, values);
        }
        res.send('CSV file processed and data saved to database');
      } catch (err) {
        console.error(err);
        res.status(500).send('Error saving data to database');
      }
    });
};

const fetchData = async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM your_table_name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data from database');
  }
};

const updateData = async (req, res) => {
  const { id, updateFields } = req.body;
  try {
    const query = 'UPDATE your_table_name SET field1 = $1, field2 = $2 WHERE id = $3';
    const values = [updateFields.field1, updateFields.field2, id];
    await client.query(query, values);
    res.send('Data updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating data');
  }
};

module.exports = { uploadCSV, fetchData, updateData };
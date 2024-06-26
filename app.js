const express = require('express');
const path = require('path');
const dataRoutes = require('./ROUTES/dataRoutes');

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', dataRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server started on port ${PORT}'));

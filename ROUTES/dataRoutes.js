const express = require('express');
const multer = require('multer');
const { uploadCSV, fetchData, updateData } = require('../controllers/dataController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('csv'), uploadCSV);
router.get('/data', fetchData);
router.post('/update', updateData);

module.exports = router;

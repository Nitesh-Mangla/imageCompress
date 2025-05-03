const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();
app.use(bodyParser.json());
const {compressor, upload} = require('../Compressor/compresse')

router.post('/compress', upload.single('file'), compressor);

module.exports = router;
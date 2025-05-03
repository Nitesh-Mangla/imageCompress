const express = require("express");
const server = require("http");
const cors = require("cors");
const path = require("path");
const app  = express();
require('dotenv').config();
const compressorRoute = require('./routes/api.js');
const webRouter = require('./Routes/web.js');

app.use('/', compressorRoute);
app.use('/', webRouter);
app.use(express.static('frontend'));
app.use(cors());

const httpServer = server.createServer(app);

httpServer.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});

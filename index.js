const express = require('express');
const cors = require('cors');
require('dotenv').config();


const rideRoutes = require('./routes/routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', rideRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Carpooling Server running on Port: ", PORT);
})


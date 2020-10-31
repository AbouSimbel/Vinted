
//Active le process.env
require('dotenv').config();
//Import des packages.
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");


//Creation et connection a la base de donnees.
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});


//Initialisation du server.
const app = express();
app.use(formidable());
app.use(cors());


//Importer les routes.
const userRoute = require("./routes/user");
app.use(userRoute);

const offerRoute = require("./routes/offer");
app.use(offerRoute);


//Allroute.
app.all("*", (req, res)=>{
    res.status(404).json("Page does not exist");
});


//Demarrage du server.
app.listen(process.env.PORT, ()=> {
    console.log("Server started");
});


/*
const response = await fetch('https://TON-ENDPOINT.com/ta-route/machin');
const json = await response.json();

const response = await (await fetch('https://pokeapi.co/api/v2/pokemon/pikachu')).json();
*/
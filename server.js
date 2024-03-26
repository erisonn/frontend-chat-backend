import dotenv from "dotenv";
import { initializeDb, createUser } from "./db.js";
import bodyParser from "body-parser";
import express from "express";
import cors from "cors";

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL;
console.log(CLIENT_URL)

const app = express();
const port = 3000;

var corsOptions = {
  origin: CLIENT_URL,
  optionsSuccessStatus: 200,
};

initializeDb();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", CLIENT_URL);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/register", cors(corsOptions), (req, res) => {
  const { user, password, email } = req.body.userData;

  createUser(user, password, email, res);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

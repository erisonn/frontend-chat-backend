import dotenv from "dotenv";
import { initializeDb, createUser, getUserByUsername } from "./db.js";
import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { PRIVATE_KEY, validateToken } from "./auth.js";

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL;

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

app.post("/login", cors(corsOptions), (req, res) => {
  const { user, password, email } = req.body.userData;

  getUserByUsername(user).then((userFromDb) => {
    if (!userFromDb) {
      return res.status(200).send("User does not exist");
    }
    bcrypt.compare(password, userFromDb?.password, function (err, result) {
      if (!result) {
        return res.status(200).send("User or password is incorrect");
      } else {
        //generate token and send it back
        const token = jsonwebtoken.sign(
          {
            user: JSON.stringify(userFromDb),
          },
          PRIVATE_KEY
        );
        return res.status(200).json({ data: { userFromDb, token } });
      }
    });
  });
});

app.use("*", validateToken);

app.get("/private", (req, res) => {
  const { user } = req.headers;
  console.log(user);
  res.status(200).send('PRIVATE ROUTE')
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

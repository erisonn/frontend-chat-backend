import dotenv from "dotenv";
import { initializeDb, createUser, getUserByUsername } from "./db.js";
import bodyParser from "body-parser";
import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { PRIVATE_KEY, validateToken } from "./auth.js";

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL;

const app = express();
const port = 3000;

initializeDb();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", CLIENT_URL);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");

  // preflight response
  if ("OPTIONS" == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.post("/register", (req, res) => {
  const { user, password, email } = req.body.userData;

  createUser(user, password, email, res);
});

app.post("/login", (req, res) => {
  const { user, password } = req.body.userData;

  getUserByUsername(user).then((userFromDb) => {
    bcrypt.compare(password, userFromDb?.password, function (err, result) {
      if (!result || !userFromDb) {
        return res.status(200).json({
          success: false,
          message: "User or password is incorrect",
        });
      } else {
        //generate token and send it as cookie
        const { password, email, ...rest } = userFromDb; // remove password before generating jwt
        const token = jsonwebtoken.sign(
          {
            user: JSON.stringify(rest),
          },
          PRIVATE_KEY
        );
        res.cookie("jwt_auth", token, { HttpOnly: true });
        return res.status(200).json({
          success: true,
          user: rest,
        });
      }
    });
  });
});

app.use("*", validateToken);

app.get("/messages", (req, res) => {
  const { user } = req.headers;
  const parsedUser = JSON.parse(user);

  res.status(200).json({
    user: {
      username: parsedUser.username,
      userId: parsedUser.userid,
    },
  });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

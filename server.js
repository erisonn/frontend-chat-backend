import dotenv from "dotenv";
import {
  initializeDb,
  createUser,
  getUserByUsername,
  createRoom,
  getRoomsByUserId,
  getMessagesbyRoomId,
} from "./db.js";
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

app.post("/api/register", (req, res) => {
  const { user, password, email } = req.body.userData;

  createUser(user, password, email, res);
});

app.post("/api/login", (req, res) => {
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

        const refreshToken = jsonwebtoken.sign(
          {
            user: JSON.stringify(rest),
          },
          PRIVATE_KEY,
          { expiresIn: "5d" }
        );

        const accessToken = jsonwebtoken.sign(
          {
            user: JSON.stringify(rest),
          },
          PRIVATE_KEY,
          { expiresIn: "30m" }
        );
        res.cookie("jwt_auth", accessToken, {
          HttpOnly: true,
          secure: true,
          sameSite: true,
        });
        res.cookie("jwt_refresh", refreshToken, {
          HttpOnly: true,
          secure: true,
          sameSite: true,
        });
        return res.status(200).json({
          success: true,
          user: rest,
        });
      }
    });
  });
});

app.get("/api/refresh", (req, res) => {
  const refreshToken = req.cookies.jwt_refresh ?? null;
  if (!refreshToken) {
    return res.status(401).json({
      message: "No refresh token provided",
    });
  }
  try {
    const payload = jsonwebtoken.verify(refreshToken, PRIVATE_KEY);
    const user = JSON.parse(payload.user);
    const { password, email, ...rest } = user;

    const accessToken = jsonwebtoken.sign(
      {
        user: JSON.stringify(rest),
      },
      PRIVATE_KEY,
      { expiresIn: "30m" }
    );
    res.cookie("jwt_auth", accessToken, {
      HttpOnly: true,
      secure: true,
      sameSite: true,
    });
    res.status(200).json({
      success: true,
      user: rest,
    });
  } catch (err) {
    console.log("refresh >>>", err);
    res.clearCookie("jwt_refresh");
    res.clearCookie("jwt_auth");
    return res.status(401).json({
      message: "Invalid refresh token",
      ...(err.message === "jwt expired" && { error: err.message }),
    });
  }
});

app.use("*", validateToken); // routes after this line requires jwt access token

app.get("/api/me", (req, res) => {
  const { user } = req.headers;
  const parsedUser = JSON.parse(user);

  res.status(200).json({
    user: parsedUser,
  });
});

app.post("/api/create-room", (req, res) => {
  const { user } = req.headers;
  const parsedUser = JSON.parse(user);

  const { title, description } = req.body;
  const { _id } = parsedUser;

  const newRoom = {
    title,
    creatorId: _id,
    description,
  };

  createRoom(newRoom, res);
});

app.get("/api/rooms", (req, res) => {
  const { user } = req.headers;
  const parsedUser = JSON.parse(user);

  const getRoomsWithLastMessage = async () => {
    const rooms = await getRoomsByUserId(parsedUser._id);
    Promise.all(
      rooms.map(async (room) => {
        const data = await getMessagesbyRoomId(room.room_id);
        const lastMessage = data.slice(-1);
        const newRoom = {
          ...room,
          lastMessage,
        };
        return newRoom;
      })
    )
      .then((data) => {
        res.status(200).json({ rooms: data });
      })
      .catch((err) => {
        console.log("getRoomsWithLastMessage >>>", err);
        res.sendStatus(500);
      });
  };
  getRoomsWithLastMessage();
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

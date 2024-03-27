import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";

dotenv.config();
const client = new pg.Client({
  database: "postgres",
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  host: process.env.DB_URL,
  port: process.env.PORT,
});

export function initializeDb() {
  const connectToDb = () => {
    client
      .connect()
      .then(() => {
        console.log("initializeDb >>> Connected to PostgreSQL database");
      })
      .catch((err) => {
        console.log("initializeDb >>> ", err);
      });
  };

  connectToDb();
}

export function createUser(user, password, email, res) {
  const saltRounds = 10;

  bcrypt.hash(password, saltRounds, function (err, hash) {
    const insertQuery = `INSERT INTO users(username, password, email) VALUES ($1, $2, $3)`;
    const values = [user, hash, email];
    client.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("createUser >>> Error executing query", err);
        res.status(400).send(
          JSON.stringify({
            postNewUser: {
              success: false,
              error: err.constraint,
            },
          })
        );
      } else {
        console.log("createUser >>> Query result:", result.rows);
        res.status(200).send(
          JSON.stringify({
            postNewUser: {
              success: true,
            },
          })
        );
      }
    });
    if (err) {
      console.log("bcrypt >>>", err);
    }
  });
}

export const getUserByUsername = async (user) => {
  const query = "SELECT * FROM users WHERE username=$1";
  const values = [user];
  const data = await client.query(query, values);
  if (data.rowCount == 0) return false;
  return data.rows[0];
};

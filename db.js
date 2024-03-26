import dotenv from "dotenv";
import pg from "pg";

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
        console.log("Connected to PostgreSQL database");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  connectToDb();
}

export function createUser(user, password, email, res) {
  const insertQuery = `INSERT INTO users(username, password, email) VALUES ($1, $2, $3)`;
  const values = [user, password, email];

  client.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error("Error executing query", err);
      res.status(400).send(
        JSON.stringify({
          postNewUser: {
            success: false,
            error: err.constraint,
          },
        })
      );
    } else {
      console.log("Query result:", result.rows);
      res.status(200).send(
        JSON.stringify({
          postNewUser: {
            success: true,
          },
        })
      );
    }
  });
}

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const dbUserChecking = (dbUser) => {
  return dbUser;
};
const passwordChecking = (password) => {
  const isPasswordMatched = bcrypt.compare(password, dbUser.password);
  return isPasswordMatched;
};
//login user API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const payload = { username: username };
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  switch (true) {
    case dbUserChecking(dbUser):
      if (dbUser === undefined) {
        response.status(400);
        response.send("Invalid User");
      }
      break;
    case passwordChecking(password):
      if (isPasswordMatched === false) {
        response.status(400);
        response.send("Invalid Password");
      }
      break;
    default:
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
  }
});

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

//login user API
app.post("/login/", async (request, response) => {
  const payload = { username: request.body.username };
  const selectUserQuery = `SELECT * FROM user WHERE username = '${request.body.username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      request.body.password,
      dbUser.password
    );
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    }
  }
});

const convertStateToResult = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};

app.get("/states/", async (request, response) => {
  const result = [];
  const authHeader = request.headers["authorization"];
  console.log(authHeader.split(" ")[1]);
  if (authHeader.split(" ")[1] !== undefined) {
    const getStatesQuery = `SELECT * FROM state ORDER BY state_id;`;
    const data = await db.all(getStatesQuery);
    for (let state of data) {
      const output = convertStateToResult(state);
      result.push(output);
    }
    response.send(result);
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
});

app.get("/states/:stateId/", async (request, response) => {
  const result = [];
  const authHeader = request.headers["authorization"];
  if (authHeader.split(" ")[1] !== undefined) {
    const getStatesQuery = `SELECT * FROM state WHERE state_id=${request.params.stateId};`;
    const data = await db.get(getStatesQuery);
    response.send(convertStateToResult(data));
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
});

app.post("/districts/", async (request, response) => {
  const result = [];
  const authHeader = request.headers["authorization"];
  if (authHeader.split(" ")[1] !== undefined) {
    const createDistrictQuery = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths) 
    VALUES('${request.body.districtName}',${request.body.stateId},${request.body.cases},${request.body.cured},${request.body.active},${request.body.deaths}) ;`;
    await db.run(createDistrictQuery);
    response.send("District Successfully Added");
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
});

app.get("/districts/:districtId/", async (request, response) => {
  const authHeader = request.headers["authorization"];
  if (authHeader.split(" ")[1] !== undefined) {
    const getDistrictQuery = `SELECT * FROM district WHERE district_id=${request.params.districtId};`;
    const data = await db.get(getDistrictQuery);
    response.send({
      districtId: data.district_id,
      districtName: data.district_name,
      stateId: data.state_id,
      cases: data.cases,
      cured: data.cured,
      active: data.active,
      deaths: data.deaths,
    });
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
});

app.delete("/districts/:districtId/", async (request, response) => {
  const authHeader = request.headers["authorization"];
  if (authHeader.split(" ")[1] !== undefined) {
    const deleteDistrictQuery = `SELECT * FROM district WHERE district_id=${request.params.districtId};`;
    await db.get(deleteDistrictQuery);
    response.send("District Removed");
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
});

app.put("/districts/:districtId/", async (request, response) => {
  const authHeader = request.headers["authorization"];
  if (authHeader.split(" ")[1] !== undefined) {
    const updateDistrictQuery = `UPDATE district SET district_name='${request.body.districtName}',
    state_id= ${request.body.stateId},
    cases= ${request.body.cases},
    cured=${request.body.cured},
    active=${request.body.active},
    deaths=${request.body.deaths} 
    WHERE district_id=${request.params.districtId};`;
    await db.run(updateDistrictQuery);
    response.send("District Details Updated");
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const authHeader = request.headers["authorization"];
  if (authHeader.split(" ")[1] !== undefined) {
    const getStatsQuery = `SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths)
     FROM district WHERE state_id=${request.params.stateId};`;
    const data = await db.get(getStatsQuery);
    response.send({
      totalCases: data["SUM(cases)"],
      totalCured: data["SUM(cured)"],
      totalActive: data["SUM(active)"],
      totalDeaths: data["SUM(deaths)"],
    });
  } else if {
    response.status(401);
    response.send("Invalid JWT Token");
  }
});

module.exports = app;

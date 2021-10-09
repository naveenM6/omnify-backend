const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { Console } = require("console");

const databasePath = path.join(__dirname, "omnify.db");

const app = express();

app.use(express.json());
app.use(cors());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(process.env.PORT || 5004, () =>
      console.log("Server Running at http://localhost:5004/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/users/", async (request, response) => {
  const { uid, firstName, lastName, email, password } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM users WHERE email = '${email}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        users (uid,first_name, last_name, email, password) 
      VALUES 
        (
          '${uid}', 
          '${firstName}',
          '${lastName}', 
          '${email}',
          '${hashedPassword}'
        )`;
    const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    const payload = {
      email: email,
    };
    const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
    response.send({ jwtToken });
  } else {
    response.status(400);
    response.send({ dataMsg: "User already exists" });
  }
});

app.post("/login", async (request, response) => {
  const { email, password } = request.body;
  const query = `SELECT * FROM users WHERE email = '${email}';`;
  const dbUser = await db.get(query);
  if (dbUser === undefined) {
    response.status(400);
    response.send({msg: "Invalid user"});
  } else {
    const isMatched = await bcrypt.compare(password, dbUser.password);
    if (isMatched === true) {
      const payload = {
        email: email,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send({ msg: "Check Credentials Again" });
    }
  }
});

app.post("/event/", async (request, response) => {
  const { name, description, start, end, day, datesArr } = request.body;
  const createUserQuery = `
      INSERT INTO 
        events (name, description, start, end, day, datesArray) 
      VALUES 
        (
          '${name}', 
          '${description}',
          '${start}', 
          '${end}',
          '${day}',
          '${datesArr}'
        )`;
  const dbResponse = await db.run(createUserQuery);
  response.send("hi");
});


app.get("/data", async(request, response) => {
  const query = "select * from events";
  const dbres = await db.all(query);
  response.send(dbres);
})
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("test");
});

app.post("/participants", (req, res) => {
  const { name } = req.body;
  if (!name || name === "") {
    return res.sendStatus(422);
  }
  /*  const findName = listParticipants.find((value) => value.name == name);
  if (findName) {
    return res.sendStatus(409);
  } */

  db.collection("participants")
    .insertOne({ name: name })
    .then((nome) => {
      res.sendStatus(201);
    }); // retorna uma promessa

  res.sendStatus(201);
});

app.get("/participants", (req, res) => {
  db.collection("participants")
    .find()
    .toArray()
    .then((participants) => {
      console.log(participants);
    });
  res.send("ok");
});

app.post("/messages", (req, res) => {
  const { messages } = req.body;
  res.status(201).send("");
});

app.get("/messages", (req, res) => {
  res.send(listMessages);
});

app.post("/status", (req, res) => {
  const { status } = req.body;
  res.status(201).send("ok");
});

app.listen(5007, () => {
  console.log("listen on 5007");
});

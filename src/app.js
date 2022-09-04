import express from "express";
import cors from "cors";
import joi from "joi";
import dayjs from "dayjs";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("bpuol");
});

const postparticipantsSchema = joi.object({
  name: joi.string().required(),
});

const postmessagesSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.valid("message", "private_message"),
});

app.post("/participants", async (req, res) => {
  const name = req.body;
  const validation = postparticipantsSchema.validate(name);
  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  try {
    const findName = await db
      .collection("participants")
      .findOne({ from: name });
    if (findName) {
      return res.status(409).send({ error: "nome já existente" });
    }

    await db.collection("messages").insertOne({
      from: name.name,
      to: "Todos",
      text: "entrou na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    });

    await db.collection("participants").insertOne({
      from: name.name,
      lastStatus: Date.now(),
    });
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(422);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const response = await db.collection("participants").find().toArray();

    res.send(response);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  const { user } = req.headers;

  const validation = postmessagesSchema.validate(req.body, {
    abortEarly: false,
  });
  if (validation.error) {
    const erros = validation.error.details.map((value) => value.message);
    res.status(422).send(erros);
    return;
  }

  try {
    const findUser = await db
      .collection("participants")
      .findOne({ from: user });
    if (!findUser) {
      res.status(404).send({ error: "usuário inexistente" });
    }

    const response = await db.collection("messages").insertOne({
      ...req.body,
      from: user,
      time: dayjs().format("HH:mm:ss"),
    });
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  const { limit } = req.query;
  const { user } = req.headers; // pra identificar quem está fazendo a requisição;

  try {
    const response = await db.collection("messages").find().toArray();

    if (limit) {
      const newResponse = response.slice(-limit);

      const listAllowed = newResponse.filter((value) => {
        if (value.type === "private_message") {
          if (user === value.from || user === value.to) {
            return true;
          } else {
            return false;
          }
        } else {
          return true;
        }
      });

      res.send(listAllowed);
      return;
    }

    res.send(listAllowed);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

app.post("/status", async (req, res) => {
  const { user } = req.headers;

  try {
    const findUser = await db
      .collection("participants")
      .findOne({ from: user });

    if (!findUser) {
      res.sendStatus(404);
      return;
    }

    const userUpdate = {
      ...findUser,
      lastStatus: Date.now(),
    };

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(404);
  }
});

app.listen(5000, () => {
  console.log("listen on 5000");
});

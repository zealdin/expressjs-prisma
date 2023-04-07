import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();

const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

app.get("/todos", async (req, res) => {
  const todos = await prisma.todo.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(todos);
});

app.post("/chat", async (req, res) => {
  const characterId = req.body.characterId
  const content = req.body.content
  if (!characterId || !content) {
    res.status(400).json({
      message: '参数不正确'
    })
    return
  }

  const authToken = process.env.AUTH_TOKEN
  if (!authToken) {
    res.status(400).json({
      message: '缺少AUTH_TOKEN'
    })
    return
  }
  await characterAI.authenticateWithToken(authToken);

  const chat = await characterAI.createOrContinueChat(characterId);
  const response = await chat.sendAndAwaitResponse(content, true)
  
  res.send({
    data: response
  })
});

app.post("/todos", async (req, res) => {
  const todo = await prisma.todo.create({
    data: {
      completed: false,
      createdAt: new Date(),
      text: req.body.text ?? "Empty todo",
    },
  });

  return res.json(todo);
});

app.get("/todos/:id", async (req, res) => {
  const id = req.params.id;
  const todo = await prisma.todo.findUnique({
    where: { id },
  });

  return res.json(todo);
});

app.put("/todos/:id", async (req, res) => {
  const id = req.params.id;
  const todo = await prisma.todo.update({
    where: { id },
    data: req.body,
  });

  return res.json(todo);
});

app.delete("/todos/:id", async (req, res) => {
  const id = req.params.id;
  await prisma.todo.delete({
    where: { id },
  });

  return res.send({ status: "ok" });
});

app.get("/", async (req, res) => {
  res.send(
    `
  <h1>Todo REST API</h1>
  <h2>Available Routes</h2>
  <pre>
    GET, POST /todos
    GET, PUT, DELETE /todos/:id
  </pre>
  `.trim(),
  );
});

app.listen(Number(port), "0.0.0.0", () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

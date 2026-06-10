const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const Chat = require("./models/Chat");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("AI Chatbot Backend Running");
});

app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant like ChatGPT. Give clean, well-formatted, readable answers. Format code properly."
          },
          {
            role: "user",
            content: message
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;

    await Chat.create({
      sessionId,
      title: message.substring(0, 30),
      userMessage: message,
      botReply: aiReply
    });

    res.json({
      reply: aiReply
    });

  } catch (error) {
    console.log(error.response?.data || error.message);

    res.status(500).json({
      error: "Something went wrong"
    });
  }
});

app.get("/history", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 });

    res.json(chats);

  } catch (error) {
    res.status(500).json({
      error: "Error fetching chats"
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: "New Chat"
    },
    userMessage: {
      type: String,
      required: true
    },
    botReply: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Chat", chatSchema);
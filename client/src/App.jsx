import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { v4 as uuidv4 } from "uuid";
import "./index.css";

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(uuidv4());
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/history");

      const grouped = {};

      res.data.forEach((chat) => {
        if (!grouped[chat.sessionId]) {
          grouped[chat.sessionId] = [];
        }

        grouped[chat.sessionId].push(chat);
      });

      setSessions(grouped);

    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      content: message
    };

    setChatHistory((prev) => [...prev, userMessage]);
    const text = message;
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/chat", {
        message: text,
        sessionId: currentSession
      });

      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.reply
        }
      ]);

      fetchHistory();

    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const openSession = (sessionId) => {
    const chats = sessions[sessionId];

    const formatted = [];

    chats.forEach((chat) => {
      formatted.push({
        role: "user",
        content: chat.userMessage
      });

      formatted.push({
        role: "assistant",
        content: chat.botReply
      });
    });

    setChatHistory(formatted);
    setCurrentSession(sessionId);
  };

  const newChat = () => {
    setChatHistory([]);
    setCurrentSession(uuidv4());
  };

  return (
    <div className={darkMode ? "app dark" : "app light"}>
      <div className="sidebar">
        <button className="new-chat-btn" onClick={newChat}>
          + New Chat
        </button>

        <div className="history-list">
          {Object.keys(sessions).map((sessionId) => (
            <div
              key={sessionId}
              className="history-item"
              onClick={() => openSession(sessionId)}
            >
              {sessions[sessionId][0]?.title}
            </div>
          ))}
        </div>

        <button
          className="theme-btn"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="main-chat">
        <div className="chat-header">
          AI CHATBOT
        </div>

        <div className="chat-box">
          {chatHistory.length === 0 && (
            <div className="welcome">
              <h1 style={{textAlign: "center"}}>How can I help you today?</h1>
            </div>
          )}

          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={chat.role === "user" ? "user-row" : "bot-row"}
            >
              <div
                className={chat.role === "user" ? "user-msg" : "bot-msg"}
              >
                <ReactMarkdown
                  components={{
                    code({ inline, children }) {
                      return !inline ? (
                        <SyntaxHighlighter language="javascript">
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code>{children}</code>
                      );
                    }
                  }}
                >
                  {chat.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {loading && (
            <div className="bot-row">
              <div className="bot-msg">AI is typing...</div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        <div className="input-wrapper">
          <div className="input-box">
            <input
              type="text"
              placeholder="Message ChatGPT..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button onClick={sendMessage}>↑</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
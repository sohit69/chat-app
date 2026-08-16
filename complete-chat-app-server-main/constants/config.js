export const corsOptions = {
  origin: [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

export const CHAT_TOKEN = "chat-token"; 
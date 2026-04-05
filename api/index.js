const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const Notification = require("./models/Notification");
const connectDB = require("./config/db");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
require("./jobs/automationJobs");


// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Pass io to routes/controllers if needed via middleware
app.set("io", io);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", routes);
app.use("/api/chat", require("./routes/chat"));

app.get("/", (req, res) => {
  res.send("Medeaz API is running with Socket.io");
});

// Error handling middleware (must be last)
app.use(errorHandler);

const onlineUsers = new Map();
io.onlineUsers = onlineUsers;
app.set("onlineUsers", onlineUsers);

// Socket.io connection handling
io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    io.emit("user_status", { userId, status: "online" });
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      io.emit("user_status", { userId: disconnectedUserId, status: "offline" });
    }
    console.log("Client disconnected");
  });
});

require("./socket/chatSocket")(io);

// Clean up notifications older than 10 days every midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running notification cleanup job...");
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  try {
    const result = await Notification.deleteMany({
      createdAt: { $lt: tenDaysAgo },
    });
    console.log(`Removed ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error("Cleanup job error:", error);
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;

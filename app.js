const path = require("path");
const http = require("http");
const express = require("express");
const socket = require("socket.io");

const formatMessage = require("./utils/message");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/user");

const app = express();
const server = http.createServer(app);
const io = socket(server);

app.use(express.static(path.join(__dirname, "public")));

const chatBot = "ChatCord Bot";

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    socket.emit("message", formatMessage(chatBot, "Welcome to ChatCord!"));
    socket.broadcast
      .to(user.room)
      .emit("message", formatMessage(chatBot, `${username} has join the chat`));

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(chatBot, `${user.username} has left the chat`)
      );
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

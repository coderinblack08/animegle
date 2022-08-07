import express from "express";
import { createServer } from "http";
import { PeerServer } from "peer";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

const peerServer = PeerServer({ port: 9000, path: "/peerjs" });

let queue: any[] = [];
let activeSockets: string[] = [];

io.on("connection", (socket) => {
  const existingSocket = activeSockets.find((sid) => sid === socket.id);
  if (!existingSocket) {
    activeSockets.push(socket.id);
    socket.on("find-match", (data) => {
      console.log(`${data.id} is looking for a match`);

      data.socketId = socket.id;
      if (queue.length > 0) {
        const match = queue.pop();
        // socket.to(match.id).emit("match-made", data.id);
        console.log("match made between", data.id, "and", match.id);
        console.log(match.socketId, data.socketId);
        socket.to(match.socketId).emit("match-made", data, true);
        socket.emit("match-made", match, false);
      } else {
        queue.push(data);
      }
      console.log({ queue, data });
    });
    socket.on("chat", (socketId, message) => {
      console.log(socketId, message);
      socket.to(socketId).emit("chat", message);
    });
    socket.on("update", (socketId, data) => {
      console.log(socketId, data);
      socket.to(socketId).emit("update", data);
    });
    socket.on("leave", (otherId) => {
      socket.to(otherId).emit("leave");
    });
    socket.on("disconnect", () => {
      // remove user form queues and active sockets
      console.log({ queue });
      queue = queue.filter((q) => q.socketId !== socket.id);
      activeSockets = activeSockets.filter((sid) => sid !== socket.id);
    });
  }
});

server.listen(4000, () => {
  console.log("Serer listening on port 4000");
});

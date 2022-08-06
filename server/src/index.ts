import express from "express";
import { Server as HTTPServer } from "http";
import { ExpressPeerServer } from "peer";
import { Server } from "socket.io";

const app = express();
const server = new HTTPServer(app);
const io = new Server(server);
const peerServer = ExpressPeerServer(server);

const queue: any[] = [];
let activeSockets: string[] = [];

app.use("/peerjs", peerServer);

io.on("connection", (socket) => {
  const existingSocket = activeSockets.find((sid) => sid === socket.id);
  if (!existingSocket) {
    activeSockets.push(socket.id);
    socket.on("find-match", (data) => {
      if (queue.length > 0) {
        const match = queue.pop();
        socket
          .to(match.id)
          .emit("match-made", { offer: data.offer, socket: socket.id });
      } else {
        queue.push(data);
      }
    });
    socket.on("disconnect", () => {
      activeSockets = activeSockets.filter((sid) => sid !== socket.id);
    });
  }
});

server.listen(4000);

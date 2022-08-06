import { io } from "socket.io-client";

export const socket = io("http://localhost:4000", {
  transports: ["websocket"],
  withCredentials: true,
});

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

# Animegle

## Overall Architecture

Example snippets of how this would be implemented (not scalable at all).

### On the server

📡 Handle audio stream with sockets...

```js
const app = express();
const httpServer = createServer(app);
const io = socketIO(httpServer);

// ...code

let activeSockets = [];
let matchingQueue = [];

io.on("connection", (socket) => {
  const existingSocket = this.activeSockets.find(
    (existingSocket) => existingSocket === socket.id
  );
  if (!existingSocket) {
    activeSockets.push(socket.id);
    socket.on("find-match", (data) => {
      matchingQueue.push(data);
      socket
        .to(data.to)
        .emit("match-made", { offer: data.offer, socket: socket.id });
    });
    socket.on("disconnect", () => {
      activeSockets = activeSockets.filter(
        (existingSocket) => existingSocket !== socket.id
      );
    });
  }
});
```

### On the client

🎤 Access user microphone and stream it to an audio tag...
🎏 Calling with WebRTC peer connections...

```js
const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();

const socket = io.connect(SOCKET_URL);

navigator.getUserMedia({ video: false, audio: true }, (stream) => {
  const localAudio = document.getElementById("audio");
  if (localAudio) {
    localAudio.srcObject = stream;
  }
  stream
    .getAudioTracks() // or getTracks()???
    .forEach((track) => peerConnection.addTrack(track, stream));
});

async function findMatch(socketId) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

  socket.emit("find-match", { offer, to: socketId });
}
```

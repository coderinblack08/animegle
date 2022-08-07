import hark from "hark";
import type { MediaConnection, Peer } from "peerjs";
import create from "zustand";
import { combine } from "zustand/middleware";
import { socket } from "./socket";

const detectWhenSpeaking = (stream: MediaStream, isMe: boolean) => {
  const options = {};
  const speechEvents = hark(stream, options);

  const { setCalling, setIAmSpeaking } = useStore.getState();

  speechEvents.on("speaking", function () {
    if (isMe) {
      setIAmSpeaking(true);
    } else {
      setCalling({ isTalking: true });
    }
  });

  speechEvents.on("stopped_speaking", function () {
    if (isMe) {
      setIAmSpeaking(false);
    } else {
      setCalling({ isTalking: false });
    }
  });
};

const addAudioStream = (stream: MediaStream) => {
  const audio = new Audio();
  audio.srcObject = stream;
  detectWhenSpeaking(stream, false);
  audio.addEventListener("loadedmetadata", () => audio.play());
  return audio;
};

type NS = string | null;
interface CallerData {
  id: string;
  socketId: string;
  username: string;
  sprite: number;
  // animeCharacter?: string;
  isTalking?: boolean;
}

export let audioStream: MediaStream;
export let leaveCall: (() => void) | null = null;

export const useStore = create(
  combine(
    {
      pending: false,
      iAmTalking: false,
      calling: null as CallerData | null,
    },
    (set, _get) => ({
      setIAmSpeaking: (iAmSpeaking: boolean) =>
        set({ iAmTalking: iAmSpeaking }),
      setPending: (pending: boolean) => set((state) => ({ ...state, pending })),
      setCalling: (calling: Partial<CallerData> | null) =>
        set(
          (state) =>
            ({
              ...state,
              calling: { ...state.calling, ...calling },
            } as any)
        ),
    })
  )
);

const handleCall = (call: MediaConnection) => {
  let audioSource: HTMLAudioElement;
  call.on("stream", (stream) => (audioSource = addAudioStream(stream)));
  socket.on("leave", () => {
    // reload window
    window.location.reload();
  });
  call.on("close", () => {
    const { setCalling, calling } = useStore.getState();
    socket.emit("leave", calling?.socketId);
    setCalling(null);
    console.log("call closed");
    audioSource.remove();
  });
};

export const listenOnDevices = async (peer: Peer) => {
  audioStream = await window.navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  detectWhenSpeaking(audioStream, true);
  const { setPending } = useStore.getState();
  peer.on("call", (call) => {
    setPending(false);
    if (!audioStream) throw new Error("No media stream found");
    call.answer(audioStream);
    handleCall(call);
  });
  socket.on("update", (data) => {
    const { setCalling, calling } = useStore.getState();
    if (calling) setCalling(data);
  });
  socket.on("match-made", (other, startCall) => {
    console.log(other);
    const { setCalling } = useStore.getState();
    if (startCall) {
      const call = peer.call(other.id, audioStream);
      handleCall(call);
    }
    setPending(false);
    setCalling(other);
  });
};

export const findMatch = async (peer: Peer, data: any) => {
  const { setPending } = useStore.getState();
  setPending(true);
  socket.emit("find-match", { id: peer.id, ...data });
};

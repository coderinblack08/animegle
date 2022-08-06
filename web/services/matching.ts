import type { MediaConnection, Peer } from "peerjs";
import create from "zustand";
import { combine } from "zustand/middleware";
import { socket } from "./socket";

const addAudioStream = (stream: MediaStream) => {
  const audio = new Audio();
  audio.srcObject = stream;
  console.log(audio);
  audio.addEventListener("loadedmetadata", () => audio.play());
  return audio;
};

type NS = string | null;
interface CallerData {
  id: string;
  socketId: string;
  username: string;
  sprite: number;
  animeCharacter?: string;
}

export let audioStream: MediaStream;
export let leaveCall: (() => void) | null = null;

export const useStore = create(
  combine(
    {
      pending: false,
      calling: null as CallerData | null,
    },
    (set, _get) => ({
      setPending: (pending: boolean) => set((state) => ({ ...state, pending })),
      setCalling: (calling: CallerData | null) =>
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
  leaveCall = () => {
    call.close();
    audioSource.remove();
  };
  call.on("stream", (stream) => (audioSource = addAudioStream(stream)));
  socket.on("leave", leaveCall);
  call.on("close", () => {
    const { setCalling } = useStore.getState();
    setCalling(null);
    audioSource.remove();
  });
};

export const listenOnDevices = async (peer: Peer) => {
  audioStream = await window.navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  const { setPending } = useStore.getState();
  peer.on("call", (call) => {
    setPending(false);
    if (!audioStream) throw new Error("No media stream found");
    call.answer(audioStream);
    handleCall(call);
  });
  socket.on("update", (data) => {
    const { setCalling } = useStore.getState();
    setCalling(data);
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

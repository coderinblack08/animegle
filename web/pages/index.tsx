import type { NextPage } from "next";
import type { Peer } from "peerjs";
import { useEffect, useRef, useState } from "react";
import shallow from "zustand/shallow";
import {
  audioStream,
  findMatch,
  leaveCall,
  listenOnDevices,
  useStore,
} from "../services/matching";

import { io } from "socket.io-client";
import { socket } from "../services/socket";

const Home: NextPage = () => {
  const peer = useRef<Peer | null>(null);
  const [username, setUsername] = useState("");
  const [sprite, setSprite] = useState(1);
  const [mute, setMute] = useState(false);
  const [calling, pending, iAmSpeaking] = useStore(
    (state) => [state.calling, state.pending, state.iAmTalking],
    shallow
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const socket = io("http://localhost:4000");

      socket.on("connect_error", (err) => {
        console.error(`connect_error due to ${err.message}`);
      });

      import("peerjs").then(({ default: Peer }) => {
        peer.current = new Peer(undefined as any, {
          path: "/peerjs",
          host: "localhost",
          port: 9000,
        });
        peer.current.on("open", () => {
          listenOnDevices(peer.current!);
        });
      });
    }
  }, []);

  useEffect(() => {
    if (audioStream) {
      audioStream.getAudioTracks().forEach((track) => (track.enabled = !mute));
    }
  }, [mute]);

  useEffect(() => {
    if (calling) {
      socket.emit("update", calling.socketId, { sprite });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprite]);

  return (
    <>
      {calling ? (
        <div className="flex items-center flex-col py-12 px-5">
          {/* <pre>{JSON.stringify(calling, null, 2)}</pre> */}
          <h1 className="text-3xl font-bold mb-6 decoration-wavy underline-offset-8 underline">
            Anime-gle
          </h1>
          <div className="max-w-5xl mx-auto w-full">
            <div className="grid gap-4 grid-cols-2">
              <div className="font-semibold rounded-xl border border-red-200 shadow-md shadow-red-200 bg-red-50/50 h-[32rem]">
                <div className="border-b p-4 border-red-200">
                  Me: {username}
                </div>
                <img
                  src={`/sprite_${sprite * 2 - (iAmSpeaking ? 0 : 1)}.png`}
                />
              </div>
              <div className="font-semibold rounded-xl border border-red-200 shadow-md shadow-red-200 bg-red-50/50 h-[32rem]">
                <div className="border-b p-4 border-red-200">
                  Your Match: {calling?.username}
                </div>
                <img
                  src={`/sprite_${
                    calling?.sprite * 2 - (calling.isTalking ? 0 : 1)
                  }.png`}
                />
              </div>
              <div className="mt-4 space-x-2">
                <button onClick={() => setMute((prev) => !prev)}>
                  🎤 {mute ? "Unmute" : "Mute"} Mic
                </button>
                <button
                  onClick={() => {
                    socket.emit("leave", calling?.socketId);
                    window.location.reload();
                  }}
                >
                  😭 Leave her
                </button>
                <select
                  value={sprite}
                  onChange={(e) => setSprite(parseInt(e.target.value))}
                  className="p-2.5 focus:outline-none rounded-lg font-bold border-2 border-red-500 border-b-4"
                >
                  <option value={1}>Blue haired girl</option>
                  <option value={2}>Brown haired girl</option>
                  {/* <option value={2}>Cat girl</option> */}
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto px-5 py-12 text-center">
          <h1 className="text-3xl font-bold mb-6 decoration-wavy underline-offset-8 underline">
            Anime-gle
          </h1>
          <div className="flex items-center space-x-2 justify-center">
            <img
              className="h-8 w-auto"
              src="https://assets.hackclub.com/flag-orpheus-top.svg"
            />
            <span>Built for HackClub Assemble</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.reactiongifs.com/wp-content/uploads/2013/02/love1.gif"
            className="w-full rounded-xl my-6"
            alt="Heart pixel gif"
          />
          {/* {calling && <p>Caller ID: {calling?.username}</p>} */}
          {pending && !calling ? (
            <p className="text-xl mb-2 font-semibold">
              💖 Matching you with someone...
            </p>
          ) : null}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                findMatch(peer.current!, { username, sprite });
              }
            }}
            type="text"
            placeholder="Your username..."
          />
          <button
            disabled={pending}
            className={`w-full ${pending ? "opacity-50" : ""} mt-2`}
            onClick={() => findMatch(peer.current!, { username, sprite })}
          >
            Match me with strangers!
          </button>
          <p className="text-red-400 font-medium mt-2 text-center text-sm">
            An interactive platform where you can meet and talk to others with
            the luxury of looking like an adorable anime girl! Built by Kevin,
            Sarah, Connor, and Ethan.
          </p>
        </div>
      )}
    </>
  );
};

export default Home;

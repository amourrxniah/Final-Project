import { io } from "socket.io-client";
import { BACKEND_URL, getToken } from "./api";

let socket = null;

export const connectSocket = async () => {
  const token = await getToken();

  socket = io(BACKEND_URL, {
    transports: ["websocket"],
    auth: {
      token,
    },
  });

  socket.on("connect", () => {
    console.log("conneted to realtime server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });

  return socket;
};

export const getSocket = () => socket;

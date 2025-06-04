import { send } from "process";

export const RaftConfig = {
  heartBeat: {
    checkInterval: 1000,
    sendInterval: 900,
    timeout: 5000,
    sendTimeout: 300,
  },
};

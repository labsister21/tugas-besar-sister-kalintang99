export const RaftConfig = {
  heartBeat: {
    checkInterval: 907,
    sendInterval: 500,
    timeout: 5000,
    sendTimeout: 300,
  },
  logCompaction: {
    enabled: true,
    threshold: 10,
  },
};

export const RaftConfig = {
  heartBeat: {
    checkInterval: 1000,
    sendInterval: 900,
    min_timeout: 3000,
    max_timeout: 6000,
    sendTimeout: 300,
  },
  logCompaction: {
    enabled: true,
    threshold: 10,
  },
};

export const RaftConfig = {
  heartBeat: {
    checkInterval: 50,
    sendInterval: 50,
    min_timeout: 1000,
    max_timeout: 2000,
    sendTimeout: 300,
  },
  logCompaction: {
    enabled: false,
    threshold: 5,
  },
};

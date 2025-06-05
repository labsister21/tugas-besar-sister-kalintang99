export const RaftConfig = {
  heartBeat: {
    checkInterval: 50,
    sendInterval: 50,
    min_timeout: 6000,
    max_timeout: 9000,
    sendTimeout: 300,
  },
  logCompaction: {
    enabled: true,
    threshold: 5,
  },
};

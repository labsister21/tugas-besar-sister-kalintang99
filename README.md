# Consensus Protocol Raft

> Repository Tugas Besar 1 IF3130 - Sistem Paralel dan Terdistribusi

## Cara Menjalankan

1. Generate file compose

```bash
# (directory: tugas-besar-sister-kalintang99/src)

bash generate-compose.sh <banyak_node_server>
bash generate-compose.sh 3
```

2. Run compose

```bash
# (directory: tugas-besar-sister-kalintang99/src)

docker-compose up --build
```

3. Insert dynamic node (Membership change)

```bash
# (directory: tugas-besar-sister-kalintang99/src)

# Build docker image first (run once)
docker build -t raftnode ./be

# Run new node
docker run --name backend4 --network raftnet -p 3004:3004 raftnode sh -c "npx nodemon --ignore snapshots/ --exec ts-node -r tsconfig-paths/register src/index.ts --id=4 --port=3004 --contactAddress=http://backend1:3001"
```

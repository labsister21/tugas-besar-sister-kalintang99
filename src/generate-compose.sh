#!/bin/bash

N=${1:-3} 
BASE_PORT=3001
FRONTEND_PORT=5173
COMPOSE_FILE="docker-compose.yml"
NETWORK_NAME="raftnet"

rm -f $COMPOSE_FILE

echo "version: '3.9'" >> $COMPOSE_FILE
echo "" >> $COMPOSE_FILE
echo "services:" >> $COMPOSE_FILE

cat <<EOF >> $COMPOSE_FILE
  backend1:
    container_name: backend1
    build:
      context: ./be
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - ./be:/app
      - /app/node_modules
    environment:
      - ID=1
      - PORT=3001
      - CHOKIDAR_USEPOLLING=true
    command: ["sh", "-c", "npx nodemon --ignore snapshots/ --exec ts-node -r tsconfig-paths/register src/index.ts --id=\$\$ID --port=\$\$PORT"]
EOF

for ((i=2; i<=N; i++)); do
  ID=$i
  PORT=$((BASE_PORT + i - 1))
  CONTACT_ADDRESS="http://backend1:3001"

  cat <<EOF >> $COMPOSE_FILE
  backend$ID:
    container_name: backend$ID
    build:
      context: ./be
      dockerfile: Dockerfile
    ports:
      - "$PORT:$PORT"
    volumes:
      - ./be:/app
      - /app/node_modules
    environment:
      - ID=$ID
      - PORT=$PORT
      - CHOKIDAR_USEPOLLING=true
    command: ["sh", "-c", "npx nodemon --ignore snapshots/ --exec ts-node -r tsconfig-paths/register src/index.ts --id=\$\$ID --port=\$\$PORT --contactAddress=$CONTACT_ADDRESS"]
EOF
done

cat <<EOF >> $COMPOSE_FILE
  frontend:
    container_name: frontend
    build:
      context: ./fe
      dockerfile: Dockerfile
    ports:
      - "$FRONTEND_PORT:$FRONTEND_PORT"
    volumes:
      - ./fe:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
      - VITE_WATCH_POLL=true
    command: ["npm", "run", "dev", "--", "--host"]
EOF

cat <<EOF >> $COMPOSE_FILE

networks:
  default:
    name: $NETWORK_NAME
    driver: bridge
EOF

echo "✅ Generated $COMPOSE_FILE with:"
echo "  - $N backend servers (ports $BASE_PORT to $((BASE_PORT+N-1)))"
echo "  - Frontend on port $FRONTEND_PORT"

N=${1:-3} 
BASE_PORT=3001
FRONTEND_PORT=5173
COMPOSE_FILE="docker-compose.yml"

rm -f $COMPOSE_FILE

echo "version: '3.9'" >> $COMPOSE_FILE
echo "" >> $COMPOSE_FILE
echo "services:" >> $COMPOSE_FILE

for ((i=1; i<=N; i++)); do
  ID=$i
  PORT=$((BASE_PORT + i - 1))

  # Generate peer list
  PEERS=()
  for ((j=1; j<=N; j++)); do
    if [ $j -ne $i ]; then
      PEER_PORT=$((BASE_PORT + j - 1))
      PEERS+=("http://localhost:$PEER_PORT")
    fi
  done
  PEER_STRING=$(IFS=, ; echo "${PEERS[*]}")

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
      - PEERS=$PEER_STRING
      - CHOKIDAR_USEPOLLING=true
    command: ["sh", "-c", "npx nodemon --exec ts-node -r tsconfig-paths/register src/index.ts --id=\$\$ID --port=\$\$PORT --peers=\$\$PEERS"]

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

echo "✅ Generated $COMPOSE_FILE with:"
echo "  - $N backend servers (ports $BASE_PORT to $((BASE_PORT+N-1)))"
echo "  - Frontend on port 5173"
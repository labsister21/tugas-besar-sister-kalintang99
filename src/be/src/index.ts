import app from "./app";

const args = require("minimist")(process.argv.slice(2));
const port = args.port;

if (!port) {
  console.error("Please specify a port using --port <port_number>");
  process.exit(1);
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

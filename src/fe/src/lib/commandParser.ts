import { apiService } from "./apiService";
import type { ParsedCommand } from "@/types/terminal";

export function parseCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  return { command, args };
}

export async function executeCommand(
  input: string,
  nodeId: number
): Promise<string> {
  const { command, args } = parseCommand(input);

  try {
    switch (command) {
      case "ping":
        return await apiService.ping(nodeId);

      case "get":
        if (args.length !== 1) {
          throw new Error("Usage: get <key>");
        }
        return await apiService.get(nodeId, args[0]);

      case "set":
        if (args.length !== 2) {
          throw new Error("Usage: set <key> <value>");
        }
        return await apiService.set(nodeId, args[0], args[1]);

      case "strln":
        if (args.length !== 1) {
          throw new Error("Usage: strln <key>");
        }
        return await apiService.strln(nodeId, args[0]);

      case "del":
        if (args.length !== 1) {
          throw new Error("Usage: del <key>");
        }
        return await apiService.del(nodeId, args[0]);

      case "append":
        if (args.length !== 2) {
          throw new Error("Usage: append <key> <value>");
        }
        return await apiService.append(nodeId, args[0], args[1]);

      case "showlog":
        return await apiService.requestLog(nodeId);

      case "showdata":
        return await apiService.requestStoredData(nodeId);

      case "help":
        return getHelpText();

      case "clear":
        return "CLEAR_TERMINAL";

      default:
        throw new Error(
          `Unknown command: ${command}. Type 'help' for available commands.`
        );
    }
  } catch (error) {
    throw error;
  }
}

function getHelpText(): string {
  const helpLines = [
    "Available commands:",
    "  ping                   - Test connection to node",
    "  get <key>              - Get value for key",
    "  set <key> <value>      - Set key to value",
    "  strln <key>            - Get string length of key",
    "  del <key>              - Delete key and return its value",
    "  append <key> <value>   - Append value to existing key",
    "  showlog                - Show current log entries",
    "  help                   - Show this help message",
    "  clear                  - Clear terminal",
  ];
  return helpLines.join("\n");
}

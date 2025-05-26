export interface TerminalLine {
  type: "input" | "output" | "error" | "info" | "processing";
  content: string;
}

export interface CommandResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface ParsedCommand {
  command: string;
  args: string[];
}

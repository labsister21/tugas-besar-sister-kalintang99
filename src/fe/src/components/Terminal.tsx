import type React from "react";

import { useState, useRef, useEffect } from "react";
import { executeCommand } from "@/lib/commandParser";
import type { TerminalLine } from "@/types/terminal";

interface TerminalProps {
  selectedNode: number;
}

export default function Terminal({ selectedNode }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: "info",
      content: `Connected to Node ${selectedNode} (localhost:${
        3000 + selectedNode
      })`,
    },
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLines([
      {
        type: "info",
        content: `Connected to Node ${selectedNode} (localhost:${
          3000 + selectedNode
        })`,
      },
    ]);
  }, [selectedNode]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading) return;

    const command = currentInput.trim();
    setLines((prev) => [...prev, { type: "input", content: `> ${command}` }]);
    setCurrentInput("");
    setIsLoading(true);

    try {
      const result = await executeCommand(command, selectedNode);

      if (result.includes("\n")) {
        const resultLines = result.split("\n");
        setLines((prev) => [
          ...prev,
          ...resultLines.map((line) => ({
            type: "output" as const,
            content: line,
          })),
        ]);
      } else if (result == "CLEAR_TERMINAL") {
        setLines([]);
      } else {
        setLines((prev) => [...prev, { type: "output", content: result }]);
      }
    } catch (error) {
      setLines((prev) => [
        ...prev,
        {
          type: "error",
          content:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-gray-300 text-sm ml-4">
          Node {selectedNode} - localhost:{3000 + selectedNode}
        </span>
      </div>

      <div
        ref={terminalRef}
        className="h-96 overflow-y-auto p-4 font-mono text-sm"
      >
        {lines.map((line, index) => (
          <div key={index} className={`mb-1 ${getLineColor(line.type)}`}>
            {line.content}
          </div>
        ))}

        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-gray-100 mr-2">{isLoading ? "" : ">"}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 bg-transparent text-gray-100 outline-none font-mono"
            placeholder={isLoading ? "Processing..." : "Enter command..."}
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}

function getLineColor(type: TerminalLine["type"]): string {
  switch (type) {
    case "input":
      return "text-gray-100";
    case "output":
      return "text-gray-200";
    case "error":
      return "text-red-400";
    case "info":
      return "text-gray-400";
    case "processing":
      return "text-gray-500";
    default:
      return "text-gray-300";
  }
}

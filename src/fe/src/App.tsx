import { useState } from "react";
import NodeSelector from "@/components/NodeSelector";
import Terminal from "@/components/Terminal";
import type { TerminalLine } from "@/types/terminal";

export default function App() {
  const [selectedNode, setSelectedNode] = useState<number>(0);
  const [terminalLines, setTerminalLines] = useState<
    Record<number, TerminalLine[]>
  >({});

  const handleNodeChange = (node: number) => {
    setSelectedNode(node);
    if (!terminalLines[node]) {
      setTerminalLines((prev) => ({
        ...prev,
        [node]: [
          {
            type: "info",
            content: `Connected to Node ${node} (localhost:${3000 + node})`,
          },
        ],
      }));
    }
  };

  const updateCurrentNodeLines = (
    newLines: TerminalLine[] | ((prevLines: TerminalLine[]) => TerminalLine[])
  ) => {
    setTerminalLines((prev) => {
      const currentLines = prev[selectedNode] || [];
      return {
        ...prev,
        [selectedNode]:
          typeof newLines === "function" ? newLines(currentLines) : newLines,
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Consensus Protocol: Raft
          </h1>
          <NodeSelector
            selectedNode={selectedNode}
            onNodeChange={handleNodeChange}
          />
        </div>

        <Terminal
          selectedNode={selectedNode}
          lines={
            terminalLines[selectedNode] || [
              {
                type: "info",
                content: `Connected to Node ${selectedNode} (localhost:${
                  3000 + selectedNode
                })`,
              },
            ]
          }
          updateLines={updateCurrentNodeLines}
        />
      </div>
    </div>
  );
}

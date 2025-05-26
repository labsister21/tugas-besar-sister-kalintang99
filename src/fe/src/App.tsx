import { useState } from "react";
import NodeSelector from "@/components/NodeSelector";
import Terminal from "@/components/Terminal";

export default function App() {
  const [selectedNode, setSelectedNode] = useState<number>(0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Consensus Protocol: Raft
          </h1>
          <NodeSelector
            selectedNode={selectedNode}
            onNodeChange={setSelectedNode}
          />
        </div>

        <Terminal selectedNode={selectedNode} />
      </div>
    </div>
  );
}

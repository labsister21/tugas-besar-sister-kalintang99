interface NodeSelectorProps {
  selectedNode: number;
  onNodeChange: (node: number) => void;
}

export default function NodeSelector({
  selectedNode,
  onNodeChange,
}: NodeSelectorProps) {
  const nodes = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <label className="text-gray-100 font-semibold">Select Node:</label>
      <select
        value={selectedNode}
        onChange={(e) => onNodeChange(Number(e.target.value))}
        className="bg-gray-800 border border-gray-600 text-gray-100 px-4 py-2 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
      >
        {nodes.map((node) => (
          <option key={node} value={node} className="bg-gray-800">
            Node {node} (Port {5000 + node})
          </option>
        ))}
      </select>
    </div>
  );
}

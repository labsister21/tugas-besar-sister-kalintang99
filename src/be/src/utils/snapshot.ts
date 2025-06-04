import fs from "fs/promises";
import path from "path";
import type { Snapshot } from "@/store/raftState.store";

const SNAPSHOT_DIR = path.resolve("/app/snapshots");

function serializeSnapshot(snapshot: Snapshot): any {
  return {
    data: Object.fromEntries(snapshot.data),
    timestamp: snapshot.timestamp,
    lastIncludedIndex: snapshot.lastIncludedIndex || -1,
    lastIncludedTerm: snapshot.lastIncludedTerm || 0,
  };
}

function deserializeSnapshot(obj: any): Snapshot {
  return {
    data: new Map(Object.entries(obj.data)),
    timestamp: obj.timestamp,
    lastIncludedIndex: obj.lastIncludedIndex || -1,
    lastIncludedTerm: obj.lastIncludedTerm || 0,
  };
}

export async function saveSnapshotToFile(snapshot: Snapshot) {
  console.log("[Snapshot] Saving snapshot to file...");
  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });

  const plain = serializeSnapshot(snapshot);
  const json = JSON.stringify(plain, null, 2);
  const fileName = `snapshot-${snapshot.timestamp}.json`;
  const filePath = path.join(SNAPSHOT_DIR, fileName);

  await fs.writeFile(filePath, json, "utf-8");
  console.log(`[Snapshot] Saved to ${filePath}`);
}

export async function loadSnapshotFromFile(): Promise<Snapshot | null> {
  try {
    const files = await fs.readdir(SNAPSHOT_DIR);
    const snapshotFiles = files
      .filter((f) => f.startsWith("snapshot-") && f.endsWith(".json"))
      .sort((a, b) => {
        const ta = parseInt(a.match(/\d+/)?.[0] || "0");
        const tb = parseInt(b.match(/\d+/)?.[0] || "0");
        return tb - ta;
      });

    if (snapshotFiles.length === 0) {
      console.warn("[Snapshot] No snapshot files found.");
      return null;
    }

    const latestSnapshotFile = snapshotFiles[0];
    const filePath = path.join(SNAPSHOT_DIR, latestSnapshotFile);
    const json = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(json);
    const snapshot = deserializeSnapshot(parsed);
    console.log(`[Snapshot] Loaded from ${filePath}`);
    return snapshot;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Snapshot] Failed to load snapshot: ${error.message}`);
    } else {
      console.error(`[Snapshot] Failed to load snapshot: ${String(error)}`);
    }
    return null;
  }
}

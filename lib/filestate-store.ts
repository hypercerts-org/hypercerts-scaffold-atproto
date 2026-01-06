import { StateStore } from "@hypercerts-org/sdk-core";
import type {
  NodeSavedState,
} from "@atproto/oauth-client-node";
import * as fs from "node:fs/promises";
import * as path from "node:path";

// Define the directory where state files will be stored.
const STATE_DIR = path.join(process.cwd(), ".tmp", "states");

export class FileStateStore implements StateStore {
  constructor() {
    // Ensure the state directory exists when the store is created.
    fs.mkdir(STATE_DIR, { recursive: true }).catch(console.error);
    console.log(
      "FileStateStore initialized. State will be stored in:",
      STATE_DIR
    );
  }

  private getFilePath(state: string): string {
    // Basic sanitization to prevent directory traversal attacks.
    if (state.includes("/") || state.includes("..")) {
      throw new Error("Invalid state parameter.");
    }
    return path.join(STATE_DIR, `${state}.json`);
  }

  async set(state: string, data: NodeSavedState): Promise<void> {
    const filePath = this.getFilePath(state);
    const content = JSON.stringify(data, null, 2);
    console.log(`FileStateStore: Writing state ${state} to ${filePath}`);
    await fs.writeFile(filePath, content, "utf-8");
  }

  async get(state: string): Promise<NodeSavedState | undefined> {
    const filePath = this.getFilePath(state);
    try {
      console.log(`FileStateStore: Reading state ${state} from ${filePath}`);
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as NodeSavedState;
    } catch (error) {
      // If the file doesn't exist (ENOENT), it's not an error, just return undefined.
      if (error.code === "ENOENT") {
        console.log(`FileStateStore: State ${state} not found.`);
        return undefined;
      }
      // For other errors, log them.
      console.error(`FileStateStore: Error reading state ${state}:`, error);
      throw error;
    }
  }

  async del(state: string): Promise<void> {
    const filePath = this.getFilePath(state);
    try {
      console.log(`FileStateStore: Deleting state ${state} from ${filePath}`);
      await fs.unlink(filePath);
    } catch (error: any) {
      // It's okay if the file is already gone.
      if (error.code !== "ENOENT") {
        console.error(`FileStateStore: Error deleting state ${state}:`, error);
        throw error;
      }
    }
  }
}

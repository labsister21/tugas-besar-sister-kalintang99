class ApiService {
  private getBaseUrl(nodeId: number): string {
    return `http://localhost:${3000 + nodeId}/commands`;
  }

  private async makeRequest(
    nodeId: number,
    endpoint: string,
    options?: RequestInit
  ): Promise<any> {
    const url = `${this.getBaseUrl(nodeId)}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for leader redirect info
        if (data && data.leader) {
          throw new Error(
            `This node is not the leader. Please connect to the leader at ${data.leader}.`
          );
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          `Connection failed to Node ${nodeId} (${url}). Is the server running?`
        );
      }
      throw error;
    }
  }

  async ping(nodeId: number): Promise<string> {
    try {
      const result = await this.makeRequest(nodeId, "/ping");
      return result.message || "PONG";
    } catch (error) {
      throw new Error(
        `Ping failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async get(nodeId: number, key: string): Promise<string> {
    try {
      const result = await this.makeRequest(
        nodeId,
        `/get/${encodeURIComponent(key)}`
      );
      return `"${result.value || ""}"`;
    } catch (error) {
      throw new Error(
        `Get failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async set(nodeId: number, key: string, value: string): Promise<string> {
    try {
      await this.makeRequest(nodeId, "/set", {
        method: "POST",
        body: JSON.stringify({ key, value }),
      });
      return "OK";
    } catch (error) {
      throw new Error(
        `Set failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async strln(nodeId: number, key: string): Promise<string> {
    try {
      const result = await this.makeRequest(
        nodeId,
        `/strln/${encodeURIComponent(key)}`
      );
      return result.length?.toString() || "0";
    } catch (error) {
      throw new Error(
        `Strln failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async del(nodeId: number, key: string): Promise<string> {
    try {
      const result = await this.makeRequest(
        nodeId,
        `/del/${encodeURIComponent(key)}`,
        {
          method: "DELETE",
        }
      );
      return `"${result.value || ""}"`;
    } catch (error) {
      throw new Error(
        `Delete failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async append(nodeId: number, key: string, value: string): Promise<string> {
    try {
      await this.makeRequest(nodeId, "/append", {
        method: "POST",
        body: JSON.stringify({ key, value }),
      });
      return "OK";
    } catch (error) {
      throw new Error(
        `Append failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async requestLog(nodeId: number): Promise<any> {
    try {
      const result = await this.makeRequest(nodeId, "/requestLog");
      const prettyLogs = JSON.stringify(result, null, 2);
      return prettyLogs || "No logs available";
    } catch (error) {
      throw new Error(
        `Request log failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async requestStoredData(nodeId: number): Promise<string> {
    try {
      const result = await this.makeRequest(nodeId, "/requestdata");
      const prettyData = JSON.stringify(result, null, 2);
      return prettyData || "No data available";
    } catch (error) {
      throw new Error(
        `Request stored data failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export const apiService = new ApiService();

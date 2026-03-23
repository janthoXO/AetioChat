import type { Response } from "express";

class SseService {
  // Map of caseId -> array of connected clients
  private clients: Map<string, { userId: string; res: Response }[]> = new Map();
  // Array of global connected clients (e.g., for case generation events)
  private globalClients: { userId: string; res: Response }[] = [];

  addGlobalClient(userId: string, res: Response) {
    this.globalClients.push({ userId, res });

    res.on("close", () => {
      this.globalClients = this.globalClients.filter((c) => c.res !== res);
    });
  }

  broadcastGlobal(eventData: any) {
    this.globalClients.forEach((client) => {
      client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    });
  }

  addClient(caseId: string, userId: string, res: Response) {
    if (!this.clients.has(caseId)) {
      this.clients.set(caseId, []);
    }
    
    const caseClients = this.clients.get(caseId)!;
    caseClients.push({ userId, res });

    // Set up cleanup when connection drops
    res.on('close', () => {
      this.removeClient(caseId, res);
    });
  }

  removeClient(caseId: string, res: Response) {
    const caseClients = this.clients.get(caseId);
    if (!caseClients) return;

    this.clients.set(
      caseId,
      caseClients.filter((c) => c.res !== res)
    );

    if (this.clients.get(caseId)?.length === 0) {
      this.clients.delete(caseId);
    }
  }

  /**
   * Send an event to specific user connected to a specific case.
   */
  sendToUser(caseId: string, userId: string, eventData: any) {
    const caseClients = this.clients.get(caseId);
    if (!caseClients) return;

    const userClient = caseClients.find((c) => c.userId === userId);
    if (userClient) {
      userClient.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    }
  }
}

export const sseService = new SseService();

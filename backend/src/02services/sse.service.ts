import type { Response } from "express";

export class SseService<T extends string | object> {
  // Map of topic -> array of connected clients
  private clients: Map<string, Response[]> = new Map();

  protected subscribe(topic: string, res: Response) {
    if (!this.clients.has(topic)) {
      this.clients.set(topic, []);
    }

    const topicClients = this.clients.get(topic)!;
    topicClients.push(res);

    // Set up cleanup when connection drops
    res.on("close", () => {
      this.unsubscribe(topic, res);
    });
  }

  protected unsubscribe(topic: string, res: Response) {
    const topicClients = this.clients.get(topic);
    if (!topicClients) return;

    const filtered = topicClients.filter((c) => c !== res);
    if (filtered.length === 0) {
      this.clients.delete(topic);
    } else {
      this.clients.set(topic, filtered);
    }
  }

  protected publish(topic: string, type: string, content: T) {
    const topicClients = this.clients.get(topic);
    if (!topicClients) return;

    topicClients.forEach((client) => {
      client.write(`data: ${JSON.stringify({ type, content })}\n\n`);
    });
  }
}

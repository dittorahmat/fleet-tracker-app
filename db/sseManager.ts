let clients: { id: string; stream: any }[] = [];

/**
 * Register a client's SSE stream.
 * @param {string} id Unique client ID
 * @param {any} stream Hono SSE stream object
 */
export function addClient(id: string, stream: any) {
  clients.push({ id, stream });
  console.log(`[SSE] Client connected: ${id}. Total clients: ${clients.length}`);
}

/**
 * Remove a client's SSE stream.
 * @param {string} id Unique client ID
 */
export function removeClient(id: string) {
  clients = clients.filter(c => c.id !== id);
  console.log(`[SSE] Client disconnected: ${id}. Total clients: ${clients.length}`);
}

/**
 * Broadcasts a message to all connected SSE clients.
 * @param {string} event Event type ('location', 'alert', etc.)
 * @param {any} data JSON serializable data payload
 */
export async function broadcast(event: string, data: any) {
  const payload = JSON.stringify(data);
  const deadClients: string[] = [];

  for (const client of clients) {
    try {
      await client.stream.writeSSE({
        event: event,
        data: payload,
      });
    } catch (err: any) {
      console.error(`[SSE] Failed writing to client ${client.id}:`, err.message);
      deadClients.push(client.id);
    }
  }

  // Clean up any dead clients we encountered during broadcast
  if (deadClients.length > 0) {
    clients = clients.filter(c => !deadClients.includes(c.id));
    console.log(`[SSE] Cleaned up ${deadClients.length} dead clients. Total clients: ${clients.length}`);
  }
}

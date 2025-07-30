// Part 1: SSE connection manager with dead client pruning
const clients = new Set<any>();

export function addClient(client: any): void {
  clients.add(client);
}

export function removeClient(client: any): void {
  clients.delete(client);
}

export function broadcastToNote(noteId: number, payload: object): void {
  const event = JSON.stringify({ noteId, ...payload });
  const deadClients = new Set();
  
  for (const client of clients) {
    try {
      client.write(`data: ${event}\n\n`);
    } catch (error) {
      console.warn('[SSE] Dead client detected, removing:', error.message);
      deadClients.add(client);
    }
  }
  
  // Remove dead clients
  for (const deadClient of deadClients) {
    clients.delete(deadClient);
  }
  
  console.log(`[SSE] Broadcasted to ${clients.size} active clients`);
}

export function getClientCount(): number {
  return clients.size;
}
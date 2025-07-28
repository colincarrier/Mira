/**
 * Real-time notification system for immediate UI updates
 * Broadcasts note creation events to all connected clients
 */

interface SSEClient {
  id: string;
  res: any;
  timestamp: Date;
}

class RealTimeNotifications {
  private clients: Map<string, SSEClient> = new Map();
  
  addClient(clientId: string, res: any) {
    this.clients.set(clientId, {
      id: clientId,
      res,
      timestamp: new Date()
    });
    
    // Clean up disconnected clients periodically
    setTimeout(() => {
      if (this.clients.has(clientId)) {
        this.removeClient(clientId);
      }
    }, 30000); // 30 second timeout
    
    console.log(`[RealTime] Client ${clientId} connected. Total clients: ${this.clients.size}`);
  }
  
  removeClient(clientId: string) {
    this.clients.delete(clientId);
    console.log(`[RealTime] Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
  }
  
  broadcastNoteCreated(noteId: number, noteData: any) {
    const message = {
      type: 'note_created',
      noteId,
      noteData,
      timestamp: new Date().toISOString()
    };
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const [clientId, client] of this.clients) {
      try {
        client.res.write(`data: ${JSON.stringify(message)}\n\n`);
        successCount++;
      } catch (error) {
        console.error(`[RealTime] Failed to send to client ${clientId}:`, error);
        this.removeClient(clientId);
        failureCount++;
      }
    }
    
    console.log(`[RealTime] Broadcasted note ${noteId} to ${successCount} clients (${failureCount} failed)`);
  }
  
  broadcastNoteUpdated(noteId: number, updates: any) {
    const message = {
      type: 'note_updated',
      noteId,
      updates,
      timestamp: new Date().toISOString()
    };
    
    for (const [clientId, client] of this.clients) {
      try {
        client.res.write(`data: ${JSON.stringify(message)}\n\n`);
      } catch (error) {
        this.removeClient(clientId);
      }
    }
  }
  
  getClientCount() {
    return this.clients.size;
  }
}

export const realTimeNotifications = new RealTimeNotifications();
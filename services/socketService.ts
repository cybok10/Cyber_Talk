import { Peer, DataConnection } from "https://esm.sh/peerjs@1.5.4?bundle-deps";

type Handler = (data: any) => void;

class P2PNetwork {
  private peer: Peer | null = null;
  private connections: DataConnection[] = [];
  private hostConn: DataConnection | null = null;
  private handlers: { [event: string]: Handler[] } = {};
  private isHost: boolean = false;
  private messageQueue: any[] = [];
  private isConnected: boolean = false;
  private myPeerId: string = '';

  constructor() {}

  on(event: string, handler: Handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  off(event: string, handler: Handler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }

  emit(event: string, data: any) {
    const payload = { event, data };
    
    // 1. Trigger locally immediately for optimistic UI
    this.triggerLocal(event, data);

    // 2. Send to network
    if (this.isConnected) {
        this.broadcast(payload);
    } else {
        this.messageQueue.push(payload);
    }
  }

  connect(roomId: string) {
    // Generate a deterministic Room ID for the Host
    // Remove special chars to ensure PeerJS compatibility
    const cleanRoomId = roomId.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // We use a specific prefix to avoid colliding with other PeerJS users
    const hostId = `ciphertalk-v2-${cleanRoomId}`;

    console.log(`[P2P] Connecting to spectrum: ${hostId}`);
    this.triggerLocal('status', { status: 'connecting', label: 'Resolving Host...' });

    // ATTEMPT 1: Try to register as the Host
    const peer = new Peer(hostId);

    peer.on('open', (id) => {
        // Success! We are the Host.
        this.isHost = true;
        this.peer = peer;
        this.myPeerId = id;
        this.isConnected = true;
        this.triggerLocal('status', { status: 'host', label: 'Host Node Active' });
        this.flushQueue();
        
        console.log('[P2P] Initialized as Host');

        peer.on('connection', (conn) => {
            console.log('[P2P] Incoming connection');
            this.connections.push(conn);
            this.setupConnection(conn);
        });
    });

    peer.on('error', (err: any) => {
        if (err.type === 'unavailable-id') {
            // ID is taken, which means a Host already exists.
            // We should connect as a Client.
            console.log('[P2P] Host detected, switching to Relay Mode...');
            this.triggerLocal('status', { status: 'connecting', label: 'Handshaking...' });
            this.connectAsClient(hostId);
        } else {
            console.error('[P2P] Peer Error:', err);
            this.triggerLocal('status', { status: 'error', label: 'Connection Failed' });
        }
    });
  }

  private connectAsClient(hostId: string) {
      // Create a peer with a random ID
      const peer = new Peer();
      peer.on('open', (id) => {
          this.peer = peer;
          this.myPeerId = id;
          this.isHost = false;
          
          // Connect to the known Host ID
          const conn = peer.connect(hostId, { reliable: true });
          this.hostConn = conn;
          
          conn.on('open', () => {
              this.isConnected = true;
              this.triggerLocal('status', { status: 'client', label: 'Secure Relay Active' });
              this.flushQueue();
              console.log('[P2P] Connected to Host');
          });
          
          // Handle connection drop
          conn.on('close', () => {
             this.isConnected = false;
             this.triggerLocal('status', { status: 'disconnected', label: 'Host Lost' });
          });

          this.setupConnection(conn);
      });
      
      peer.on('error', (err) => {
          console.error('[P2P] Client Error', err);
      });
  }

  private setupConnection(conn: DataConnection) {
      conn.on('data', (data: any) => {
          // 1. Process the message locally
          if (data && data.event) {
              this.triggerLocal(data.event, data.data);
          }

          // 2. If I am the Host, I must relay this message to all OTHER connected clients
          // This implements a Star Topology where clients only talk to Host, and Host echos to everyone.
          if (this.isHost) {
              this.connections.forEach(c => {
                  // Don't send back to the person who sent it
                  if (c.peer !== conn.peer && c.open) {
                      c.send(data);
                  }
              });
          }
      });
      
      conn.on('close', () => {
          this.connections = this.connections.filter(c => c !== conn);
      });
  }

  private broadcast(payload: any) {
      if (this.isHost) {
          // Host sends to everyone
          this.connections.forEach(conn => {
              if (conn.open) conn.send(payload);
          });
      } else if (this.hostConn && this.hostConn.open) {
          // Client sends to Host
          this.hostConn.send(payload);
      }
  }

  private triggerLocal(event: string, data: any) {
    const eventHandlers = this.handlers[event];
    if (eventHandlers) {
      eventHandlers.forEach(handler => handler(data));
    }
  }

  private flushQueue() {
      if (this.messageQueue.length === 0) return;
      console.log(`[P2P] Flushing ${this.messageQueue.length} queued messages`);
      while(this.messageQueue.length > 0) {
          const payload = this.messageQueue.shift();
          this.broadcast(payload);
      }
  }
}

export const socket = new P2PNetwork();
////////
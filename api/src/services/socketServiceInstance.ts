import SocketService from './socketService';

let socketServiceInstance: SocketService | null = null;

export const initializeSocketService = (server: any): void => {
  if (socketServiceInstance) {
    throw new Error('Socket service already initialized');
  }
  socketServiceInstance = new SocketService(server);
};

export const getSocketService = (): SocketService => {
  if (!socketServiceInstance) {
    throw new Error('Socket service not initialized. Call initializeSocketService first.');
  }
  return socketServiceInstance;
};

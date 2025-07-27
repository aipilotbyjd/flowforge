import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '../auth/strategies/jwt.strategy';

export interface ExecutionStatusUpdate {
  executionId: string;
  workflowId: string;
  status: 'queued' | 'running' | 'success' | 'error' | 'cancelled';
  progress?: {
    completedNodes: number;
    totalNodes: number;
    currentNode?: string;
  };
  startTime?: Date;
  endTime?: Date;
  error?: string;
  result?: any;
}

export interface NodeExecutionUpdate {
  executionId: string;
  nodeId: string;
  nodeName: string;
  status: 'running' | 'success' | 'error';
  startTime: Date;
  endTime?: Date;
  inputData?: any;
  outputData?: any;
  error?: string;
  executionTime?: number;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/execution-status',
})
export class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger(WebSocketGateway.name);
  private connectedClients = new Map<string, Socket>();
  private clientSubscriptions = new Map<string, Set<string>>(); // clientId -> Set of executionIds

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
    this.clientSubscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe-execution')
  handleSubscribeExecution(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { executionId } = data;
    
    if (!this.clientSubscriptions.has(client.id)) {
      this.clientSubscriptions.set(client.id, new Set());
    }
    
    this.clientSubscriptions.get(client.id)?.add(executionId);
    client.join(`execution-${executionId}`);
    
    this.logger.debug(`Client ${client.id} subscribed to execution ${executionId}`);
    
    return {
      event: 'subscription-confirmed',
      data: { executionId, subscribed: true },
    };
  }

  @SubscribeMessage('unsubscribe-execution')
  handleUnsubscribeExecution(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { executionId } = data;
    
    this.clientSubscriptions.get(client.id)?.delete(executionId);
    client.leave(`execution-${executionId}`);
    
    this.logger.debug(`Client ${client.id} unsubscribed from execution ${executionId}`);
    
    return {
      event: 'unsubscription-confirmed',
      data: { executionId, subscribed: false },
    };
  }

  @SubscribeMessage('subscribe-workflow')
  handleSubscribeWorkflow(
    @MessageBody() data: { workflowId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { workflowId } = data;
    client.join(`workflow-${workflowId}`);
    
    this.logger.debug(`Client ${client.id} subscribed to workflow ${workflowId}`);
    
    return {
      event: 'workflow-subscription-confirmed',
      data: { workflowId, subscribed: true },
    };
  }

  @SubscribeMessage('get-execution-status')
  async handleGetExecutionStatus(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { executionId } = data;
    
    // TODO: Fetch current execution status from database
    // This would integrate with your execution service
    
    return {
      event: 'execution-status',
      data: {
        executionId,
        // status: currentStatus,
        message: 'Status retrieval not yet implemented',
      },
    };
  }

  // Public methods to emit updates from other services
  
  /**
   * Broadcast execution status update to all subscribed clients
   */
  broadcastExecutionUpdate(update: ExecutionStatusUpdate) {
    this.server
      .to(`execution-${update.executionId}`)
      .emit('execution-status-update', update);
      
    // Also broadcast to workflow subscribers
    this.server
      .to(`workflow-${update.workflowId}`)
      .emit('workflow-execution-update', update);
      
    this.logger.debug(`Broadcasted execution update for ${update.executionId}: ${update.status}`);
  }

  /**
   * Broadcast node execution update to subscribed clients
   */
  broadcastNodeUpdate(update: NodeExecutionUpdate) {
    this.server
      .to(`execution-${update.executionId}`)
      .emit('node-execution-update', update);
      
    this.logger.debug(`Broadcasted node update for execution ${update.executionId}, node ${update.nodeId}: ${update.status}`);
  }

  /**
   * Send execution started notification
   */
  notifyExecutionStarted(executionId: string, workflowId: string, startTime: Date) {
    const update: ExecutionStatusUpdate = {
      executionId,
      workflowId,
      status: 'running',
      startTime,
    };
    
    this.broadcastExecutionUpdate(update);
  }

  /**
   * Send execution completed notification
   */
  notifyExecutionCompleted(
    executionId: string, 
    workflowId: string, 
    status: 'success' | 'error', 
    endTime: Date,
    result?: any,
    error?: string
  ) {
    const update: ExecutionStatusUpdate = {
      executionId,
      workflowId,
      status,
      endTime,
      result,
      error,
    };
    
    this.broadcastExecutionUpdate(update);
  }

  /**
   * Send execution progress update
   */
  notifyExecutionProgress(
    executionId: string, 
    workflowId: string, 
    completedNodes: number, 
    totalNodes: number,
    currentNode?: string
  ) {
    const update: ExecutionStatusUpdate = {
      executionId,
      workflowId,
      status: 'running',
      progress: {
        completedNodes,
        totalNodes,
        currentNode,
      },
    };
    
    this.broadcastExecutionUpdate(update);
  }

  /**
   * Send node execution started notification
   */
  notifyNodeStarted(
    executionId: string,
    nodeId: string,
    nodeName: string,
    startTime: Date,
    inputData?: any
  ) {
    const update: NodeExecutionUpdate = {
      executionId,
      nodeId,
      nodeName,
      status: 'running',
      startTime,
      inputData,
    };
    
    this.broadcastNodeUpdate(update);
  }

  /**
   * Send node execution completed notification
   */
  notifyNodeCompleted(
    executionId: string,
    nodeId: string,
    nodeName: string,
    status: 'success' | 'error',
    startTime: Date,
    endTime: Date,
    outputData?: any,
    error?: string,
    executionTime?: number
  ) {
    const update: NodeExecutionUpdate = {
      executionId,
      nodeId,
      nodeName,
      status,
      startTime,
      endTime,
      outputData,
      error,
      executionTime,
    };
    
    this.broadcastNodeUpdate(update);
  }

  /**
   * Get connected client count
   */
  getConnectedClientCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    let total = 0;
    for (const subscriptions of this.clientSubscriptions.values()) {
      total += subscriptions.size;
    }
    return total;
  }

  /**
   * Send custom message to specific client
   */
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}

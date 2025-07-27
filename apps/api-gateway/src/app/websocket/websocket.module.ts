import { Module } from '@nestjs/common';
import { WebSocketGateway as ExecutionStatusGateway } from './websocket.gateway';

@Module({
  providers: [ExecutionStatusGateway],
  exports: [ExecutionStatusGateway],
})
export class WebSocketModule {}

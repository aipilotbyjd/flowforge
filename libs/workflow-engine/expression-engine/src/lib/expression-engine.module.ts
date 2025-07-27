import { Module } from '@nestjs/common';
import { ExpressionEngineService } from './expression-engine.service';

@Module({
  providers: [ExpressionEngineService],
  exports: [ExpressionEngineService],
})
export class ExpressionEngineModule {}

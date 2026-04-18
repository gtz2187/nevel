import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module.js';
import { AiModule } from './ai/ai.module.js';

@Module({
  imports: [ProjectsModule, AiModule]
})
export class AppModule {}

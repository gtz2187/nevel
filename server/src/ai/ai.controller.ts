import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service.js';
import type {
  AskAIInput,
  ExtractEntitiesInput,
  RecommendEntitiesInput
} from '../../../shared/models.js';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  ask(@Body() payload: AskAIInput) {
    return this.aiService.ask(payload);
  }

  @Post('extract')
  extract(@Body() payload: ExtractEntitiesInput) {
    return this.aiService.extract(payload);
  }

  @Post('recommend-characters')
  recommendCharacters(@Body() payload: RecommendEntitiesInput) {
    return this.aiService.recommendCharacters(payload);
  }
}

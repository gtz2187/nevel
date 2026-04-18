import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { AppModule } from './src/app.module.js';

export async function startServer() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  await app.listen(3777);
  console.log('MoZhe local server running at http://127.0.0.1:3777/api');
  return app;
}

const maybeEntrypoint = process.argv[1];
const isDirectRun = Boolean(maybeEntrypoint)
  && import.meta.url === pathToFileURL(path.resolve(maybeEntrypoint)).href;

if (isDirectRun) {
  void startServer();
}

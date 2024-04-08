import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appPrepare } from './app.prepare';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  appPrepare(app);

  await app.listen(3000);
}
void bootstrap();

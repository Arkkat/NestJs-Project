import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function appPrepare(app: INestApplication) {
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http' }, 'admin')
    .addBearerAuth({ type: 'http' }, 'admin/workspace')
    .addBearerAuth({ type: 'http' }, 'user')
    .addBearerAuth({ type: 'http' }, 'user/workspace')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/doc', app, document);
}

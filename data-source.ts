import { config } from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB,
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [path.join(__dirname, 'src/entities/*.entity.ts')],
  migrations: [path.join(__dirname, 'src/migrations/*.ts')],
});

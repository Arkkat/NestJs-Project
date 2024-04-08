import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspaces } from '../../entities/workspace.entity';

type Workspace = Pick<Workspaces, 'id' | 'name' | 'createdAt'>;
const CACHE_TTL = 60 * 1000;

@Injectable()
export class WorkspaceService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(Workspaces) private readonly workspaceRepository: Repository<Workspaces>,
  ) {}

  async getWorkspaces() {
    const cached = await this.cacheManager.get<Workspace[]>('workspaces');
    if (cached) return cached;

    const result = await this.workspaceRepository.find({
      select: ['id', 'name', 'createdAt'],
      where: { public: true },
    });
    await this.cacheManager.set('workspaces', result, CACHE_TTL);
    return result;
  }
}

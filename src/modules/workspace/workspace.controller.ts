import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';

@ApiTags('workspace')
@Controller({ path: 'workspace', version: '1' })
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  async getWorkspace() {
    return this.workspaceService.getWorkspaces();
  }
}

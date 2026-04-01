import {
  Controller, Get, Post, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { SubmitInspectionDto } from './dto/submit-inspection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inspections')
export class InspectionsController {
  constructor(private inspectionsService: InspectionsService) {}

  /**
   * POST /api/inspections
   * Any authenticated user can submit (service enforces kit assignment).
   */
  @Post()
  submit(
    @Body() dto: SubmitInspectionDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.inspectionsService.submit(dto, user);
  }

  /**
   * GET /api/inspections?kitId=xxx
   * Admin: all logs; Checker: their own logs.
   */
  @Get()
  findAll(
    @Query('kitId') kitId: string | undefined,
    @CurrentUser() user: { id: string; role: string },
  ) {
    if (user.role === Role.ADMIN) {
      return this.inspectionsService.findAll(kitId);
    }
    return this.inspectionsService.findByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectionsService.findOne(id);
  }
}

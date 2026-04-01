import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitInspectionDto } from './dto/submit-inspection.dto';
import { Role } from '@prisma/client';

const LOG_INCLUDE = {
  kit: { select: { id: true, name: true } },
  inspectedBy: { select: { id: true, fullName: true, email: true } },
  items: { include: { kitItem: true } },
};

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit an inspection:
   *  1. Verify the checker is assigned to the kit (or is an admin).
   *  2. Update each KitItem with the found quantity / expiry date.
   *  3. Write one InspectionLog + N InspectionLogItems — all in a transaction.
   */
  async submit(
    dto: SubmitInspectionDto,
    inspector: { id: string; role: string },
  ) {
    // 1. Authorization check
    const kit = await this.prisma.kit.findUnique({
      where: { id: dto.kitId },
      include: { assignees: { select: { id: true } } },
    });
    if (!kit) throw new NotFoundException('Kit not found');
    if (
      inspector.role !== Role.ADMIN &&
      !kit.assignees.some((a) => a.id === inspector.id)
    ) {
      throw new ForbiddenException('You are not assigned to this kit');
    }

    // 2. Run everything in a single transaction
    return this.prisma.$transaction(async (tx) => {
      // Update each KitItem
      for (const item of dto.items) {
        const kitItem = await tx.kitItem.findFirst({
          where: { id: item.kitItemId, kitId: dto.kitId },
        });
        if (!kitItem) {
          throw new NotFoundException(`KitItem ${item.kitItemId} not found in this kit`);
        }
        await tx.kitItem.update({
          where: { id: item.kitItemId },
          data: {
            quantity: item.quantityFound,
            expirationDate: item.expirationDateFound !== undefined
              ? (item.expirationDateFound ? new Date(item.expirationDateFound) : null)
              : undefined,
            notes: item.notes ?? kitItem.notes,
          },
        });
      }

      // Create the log
      const log = await tx.inspectionLog.create({
        data: {
          kitId: dto.kitId,
          inspectedById: inspector.id,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              kitItemId: item.kitItemId,
              quantityFound: item.quantityFound,
              expirationDateFound: item.expirationDateFound
                ? new Date(item.expirationDateFound)
                : null,
              notes: item.notes,
            })),
          },
        },
        include: LOG_INCLUDE,
      });

      return log;
    });
  }

  /** Admin: list all inspection logs, optionally filtered by kit. */
  findAll(kitId?: string) {
    return this.prisma.inspectionLog.findMany({
      where: kitId ? { kitId } : undefined,
      include: LOG_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Checker: their own inspection history. */
  findByUser(userId: string) {
    return this.prisma.inspectionLog.findMany({
      where: { inspectedById: userId },
      include: LOG_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.inspectionLog.findUnique({
      where: { id },
      include: LOG_INCLUDE,
    });
    if (!log) throw new NotFoundException('Inspection log not found');
    return log;
  }
}

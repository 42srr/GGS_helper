import {
  Controller,
  Get,
  UseGuards,
  Req,
  Patch,
  Param,
  Body,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  RequirePermissions,
  OwnerOnly,
} from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:read')
  async findAll(@Query('role') role?: Role) {
    if (role) {
      return await this.userService.getUsersByRole(role);
    }
    return await this.userService.findAllWithReservationCount();
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:export')
  async exportToExcel(@Res() res: Response) {
    const buffer = await this.userService.exportToExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=users_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
    res.send(buffer);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:update')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return await this.userService.updateUser(+id, updateData);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:role:update')
  async updateUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return await this.userService.updateUserRole(+id, role);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @OwnerOnly()
  async getUserStats(@Req() req: AuthenticatedRequest) {
    return await this.userService.getUserStats(req.user.userId);
  }

  @Get('reservation-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @OwnerOnly()
  async getReservationStatus(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.findOne(req.user.userId);

    if (!user) {
      return {
        canReserve: false,
        isBanned: false,
        banUntil: null,
        reason: '사용자를 찾을 수 없습니다'
      };
    }

    const now = new Date();
    // 영구 금지(banUntil이 null)이거나 금지 기간이 남아있는 경우
    const isBanned = user.isReservationBanned && (!user.banUntil || user.banUntil > now);

    return {
      canReserve: !isBanned,
      isBanned: isBanned,
      banUntil: user.banUntil, // null이면 영구 금지
      noShowCount: user.noShowCount,
      lateCount: user.lateCount
    };
  }

  @Patch(':id/reservation-ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:update')
  async updateReservationBan(
    @Param('id') id: string,
    @Body() body: { isReservationBanned: boolean; banUntil?: string | null }
  ) {
    const user = await this.userService.findOne(+id);

    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다' };
    }

    user.isReservationBanned = body.isReservationBanned;
    user.banUntil = body.banUntil ? new Date(body.banUntil) : null;

    await this.userService.updateUser(+id, {
      isReservationBanned: user.isReservationBanned,
      banUntil: user.banUntil
    });

    return {
      success: true,
      message: '예약 금지 상태가 업데이트되었습니다',
      user: {
        userId: user.userId,
        isReservationBanned: user.isReservationBanned,
        banUntil: user.banUntil
      }
    };
  }

}

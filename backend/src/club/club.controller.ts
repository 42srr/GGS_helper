import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { JoinClubDto } from './dto/join-club.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';

@Controller('clubs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  // 동아리 생성
  @Post()
  @RequirePermissions('club:create')
  create(@Body() createClubDto: CreateClubDto) {
    return this.clubService.createClub(createClubDto);
  }

  // 동아리 멤버 가입
  @Post('join')
  @RequirePermissions('club:join')
  joinClub(@Body() joinClubDto: JoinClubDto) {
    return this.clubService.joinClub(joinClubDto);
  }

  // ===== 관리자 전용 라우트 (먼저 정의) =====

  // 모든 동아리 목록 조회 (관리자)
  @Get('admin/all')
  @RequirePermissions('admin:*')
  findAllClubs() {
    return this.clubService.findAll();
  }

  // 승인 대기 중인 동아리 목록 조회 (관리자)
  @Get('admin/pending')
  @RequirePermissions('admin:*')
  findPendingClubs() {
    return this.clubService.findPendingClubs();
  }

  // 동아리 승인 (관리자)
  @Patch('admin/:id/approve')
  @RequirePermissions('admin:*')
  approveClub(@Param('id') id: string) {
    return this.clubService.approveClub(+id);
  }

  // 동아리 거부 (관리자)
  @Patch('admin/:id/reject')
  @RequirePermissions('admin:*')
  rejectClub(@Param('id') id: string) {
    return this.clubService.rejectClub(+id);
  }

  // ===== 일반 라우트 =====

  // 동아리 목록 조회
  @Get()
  @RequirePermissions('club:read')
  findAll() {
    return this.clubService.findAll();
  }

  // 동아리 멤버 목록 조회
  @Get(':id/members')
  @RequirePermissions('club:read')
  getMembers(@Param('id') id: string) {
    return this.clubService.getClubMembers(+id);
  }

  // 동아리 상세 조회
  @Get(':id')
  @RequirePermissions('club:read')
  findOne(@Param('id') id: string) {
    return this.clubService.findOne(+id);
  }

  // 동아리 정보 수정
  @Patch(':id')
  @RequirePermissions('club:update')
  update(@Param('id') id: string, @Body() updateClubDto: UpdateClubDto) {
    return this.clubService.updateClub(+id, updateClubDto);
  }

  // 동아리 멤버 상태 변경
  @Patch(':clubId/members/:userId/status')
  @RequirePermissions('club:update')
  updateMemberStatus(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Body() updateStatusDto: UpdateMemberStatusDto,
  ) {
    return this.clubService.updateMemberStatus(+clubId, +userId, updateStatusDto);
  }

  // 동아리 멤버 역할 변경
  @Patch(':clubId/members/:userId/role')
  @RequirePermissions('club:update')
  updateMemberRole(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ) {
    return this.clubService.updateMemberRole(+clubId, +userId, updateRoleDto);
  }

  // 동아리 삭제
  @Delete(':id')
  @RequirePermissions('club:delete')
  remove(@Param('id') id: string) {
    return this.clubService.remove(+id);
  }
}

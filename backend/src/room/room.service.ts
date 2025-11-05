import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AdminService } from '../admin/admin.service';
import { ActivityType } from '../admin/entities/activity-log.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @Inject(forwardRef(() => AdminService))
    private adminService: AdminService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(createRoomDto);
    const savedRoom = await this.roomRepository.save(room);

    // 활동 로그 기록
    try {
      await this.adminService.logActivity(
        ActivityType.ROOM_CREATED,
        '새 회의실 추가됨',
        `관리자에 의해 '${savedRoom.name}' 추가`,
        undefined,
        {
          roomId: savedRoom.roomId,
          roomName: savedRoom.name,
          location: savedRoom.location,
        },
        'success',
      );
    } catch (error) {
      console.error('Failed to log room creation activity:', error);
    }

    return savedRoom;
  }

  async findAll(): Promise<Room[]> {
    return await this.roomRepository.find({
      where: { isAvailable: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(roomId: number): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { roomId, isAvailable: true },
      relations: ['reservations'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    return room;
  }

  async update(roomId: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(roomId);
    const oldName = room.name;
    Object.assign(room, updateRoomDto);
    const updatedRoom = await this.roomRepository.save(room);

    // 활동 로그 기록
    try {
      await this.adminService.logActivity(
        ActivityType.ROOM_UPDATED,
        '회의실 정보 수정됨',
        `'${oldName}' 회의실 정보가 수정되었습니다`,
        undefined,
        {
          roomId: updatedRoom.roomId,
          roomName: updatedRoom.name,
          changes: updateRoomDto,
        },
        'info',
      );
    } catch (error) {
      console.error('Failed to log room update activity:', error);
    }

    return updatedRoom;
  }

  async remove(roomId: number): Promise<void> {
    const room = await this.findOne(roomId);
    room.isAvailable = false;
    await this.roomRepository.save(room);
  }

  async uploadFromExcel(
    file: Express.Multer.File,
  ): Promise<{ success: number; errors: string[]; replaced: number }> {
    console.log('Processing Excel file upload...');

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Excel data rows:', jsonData.length);

    // 먼저 기존 모든 회의실 데이터 삭제
    console.log('Removing existing rooms...');
    const existingRooms = await this.roomRepository.find();
    const replacedCount = existingRooms.length;

    if (replacedCount > 0) {
      // 1단계: 모든 예약 삭제 (외래키 제약조건 해결)
      console.log('Deleting all reservations first...');
      await this.reservationRepository
        .createQueryBuilder()
        .delete()
        .from(Reservation)
        .execute();

      // 2단계: 회의실 삭제
      console.log('Now deleting all rooms...');
      await this.roomRepository
        .createQueryBuilder()
        .delete()
        .from(Room)
        .execute();

      console.log(`Deleted ${replacedCount} existing rooms and all reservations`);
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any;

      try {
        // 승인필요 필드 파싱
        const isConfirmValue = row['승인필요'] || row['isConfirm'];
        const isConfirm = isConfirmValue === 'Y' || isConfirmValue === true || isConfirmValue === 'true';

        const roomData: CreateRoomDto = {
          name: row['회의실명'] || row['name'] || '',
          location: row['위치'] || row['location'] || '',
          capacity: parseInt(row['수용인원'] || row['capacity']) || 0,
          description: row['설명'] || row['description'] || '',
          equipment: row['장비'] || row['equipment'] || '',
          isActive: row['활성화'] !== false && row['isActive'] !== false,
          isConfirm: isConfirm,
        };

        console.log(`Processing row ${i + 1}:`, roomData);

        // 유효성 검사
        if (!roomData.name || !roomData.location || !roomData.capacity) {
          errors.push(
            `Row ${i + 2}: 필수 필드가 누락되었습니다 (회의실명, 위치, 수용인원)`,
          );
          continue;
        }

        await this.create(roomData);
        successCount++;
        console.log(`Successfully created room: ${roomData.name}`);
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    // Excel 업로드 활동 로그 기록
    if (successCount > 0) {
      try {
        await this.adminService.logActivity(
          ActivityType.EXCEL_UPLOAD,
          'Excel 데이터 업로드',
          `${successCount}개 회의실 정보 일괄 업데이트`,
          undefined,
          {
            successCount,
            totalRows: jsonData.length,
            errorCount: errors.length,
          },
          'info',
        );
      } catch (error) {
        console.error('Failed to log Excel upload activity:', error);
      }
    }

    console.log(`Upload completed: ${successCount} success, ${errors.length} errors, ${replacedCount} replaced`);
    return { success: successCount, errors, replaced: replacedCount };
  }

  async exportToExcel(): Promise<Buffer> {
    const rooms = await this.roomRepository.find({
      order: { name: 'ASC' },
    });

    const exportData = rooms.map((room) => ({
      ID: room.roomId,
      회의실명: room.name,
      위치: room.location,
      수용인원: room.capacity,
      설명: room.description || '',
      장비: room.equipment || '',
      활성화: room.isAvailable ? 'Y' : 'N',
      승인필요: room.isConfirm ? 'Y' : 'N',
      생성일: room.createdAt.toLocaleDateString('ko-KR'),
      수정일: room.updatedAt.toLocaleDateString('ko-KR'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 5 }, // ID
      { wch: 20 }, // 회의실명
      { wch: 15 }, // 위치
      { wch: 10 }, // 수용인원
      { wch: 30 }, // 설명
      { wch: 20 }, // 장비
      { wch: 8 }, // 활성화
      { wch: 10 }, // 승인필요
      { wch: 12 }, // 생성일
      { wch: 12 }, // 수정일
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '회의실목록');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async getExcelTemplate(): Promise<Buffer> {
    const templateData = [
      {
        회의실명: '회의실 A',
        위치: '1층',
        수용인원: 8,
        설명: '프로젝트 회의용',
        장비: 'TV, 화이트보드',
        활성화: 'Y',
        승인필요: 'N',
      },
      {
        회의실명: '회의실 B',
        위치: '2층',
        수용인원: 12,
        설명: '대형 회의용',
        장비: '프로젝터, 스크린',
        활성화: 'Y',
        승인필요: 'Y',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 20 }, // 회의실명
      { wch: 15 }, // 위치
      { wch: 10 }, // 수용인원
      { wch: 30 }, // 설명
      { wch: 20 }, // 장비
      { wch: 8 }, // 활성화
      { wch: 10 }, // 승인필요
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '회의실템플릿');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async searchRooms(query: string): Promise<Room[]> {
    return await this.roomRepository
      .createQueryBuilder('room')
      .where('room.room_isavailable = :isAvailable', { isAvailable: true })
      .andWhere(
        '(room.room_name ILIKE :query OR room.room_location ILIKE :query OR room.room_description ILIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('room.room_name', 'ASC')
      .getMany();
  }
}

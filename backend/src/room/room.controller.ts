import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @RequirePermissions('room:create')
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @RequirePermissions('room:read')
  findAll(@Query('search') search?: string) {
    if (search) {
      return this.roomService.searchRooms(search);
    }
    return this.roomService.findAll();
  }

  @Get('template')
  @RequirePermissions('room:read')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.roomService.getExcelTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=room_template.xlsx',
    );
    res.send(buffer);
  }

  @Get('export')
  @RequirePermissions('room:read')
  async exportToExcel(@Res() res: Response) {
    const buffer = await this.roomService.exportToExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=rooms_export.xlsx',
    );
    res.send(buffer);
  }

  @Post('upload')
  @RequirePermissions('room:create')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  }))
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    console.log('Upload Excel endpoint called');
    console.log('File received:', file ? 'Yes' : 'No');

    if (!file) {
      console.error('No file uploaded');
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      console.error('Invalid file type:', file.originalname);
      throw new HttpException(
        'Only Excel files are allowed',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      console.log('Processing Excel file...');
      const result = await this.roomService.uploadFromExcel(file);
      console.log('Upload result:', result);

      return {
        message: 'File processed successfully',
        success: result.success,
        errors: result.errors,
        replaced: result.replaced,
        total: result.success + result.errors.length,
      };
    } catch (error) {
      console.error('Upload processing error:', error);
      throw new HttpException(
        'Failed to process Excel file: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomService.update(+id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomService.remove(+id);
  }
}

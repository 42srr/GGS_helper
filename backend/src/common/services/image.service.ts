import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private sharp: any;

  constructor() {
    // Sharp를 동적으로 로드 시도
    try {
      this.sharp = require('sharp');
      this.logger.log('Sharp module loaded successfully');
    } catch (error) {
      this.logger.warn(
        'Sharp module not available. Image optimization will be skipped.',
      );
      this.sharp = null;
    }
  }

  /**
   * 이미지 리사이징 및 최적화
   * Sharp가 없으면 원본 파일을 그대로 사용
   */
  async optimizeImage(
    filePath: string,
    maxWidth: number = 1200,
    quality: number = 80,
  ): Promise<string> {
    if (!this.sharp) {
      // Sharp가 없으면 파일명만 변경
      const outputPath = filePath.replace(
        path.extname(filePath),
        '_optimized' + path.extname(filePath),
      );
      fs.copyFileSync(filePath, outputPath);
      fs.unlinkSync(filePath);
      return outputPath;
    }

    const outputPath = filePath.replace(
      path.extname(filePath),
      '_optimized' + path.extname(filePath),
    );

    try {
      await this.sharp(filePath)
        .resize(maxWidth, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toFile(outputPath);

      // 원본 파일 삭제
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return outputPath;
    } catch (error) {
      this.logger.error('Failed to optimize image:', error);
      // 실패 시 원본 파일 사용
      const fallbackPath = filePath.replace(
        path.extname(filePath),
        '_optimized' + path.extname(filePath),
      );
      fs.copyFileSync(filePath, fallbackPath);
      fs.unlinkSync(filePath);
      return fallbackPath;
    }
  }

  /**
   * 썸네일 생성
   * Sharp가 없으면 원본 파일 복사
   */
  async createThumbnail(filePath: string, size: number = 300): Promise<string> {
    const thumbnailPath = filePath.replace(
      path.extname(filePath),
      '_thumb' + path.extname(filePath),
    );

    if (!this.sharp) {
      // Sharp가 없으면 원본 복사
      fs.copyFileSync(filePath, thumbnailPath);
      return thumbnailPath;
    }

    try {
      await this.sharp(filePath)
        .resize(size, size, {
          fit: 'cover',
        })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      this.logger.error('Failed to create thumbnail:', error);
      // 실패 시 원본 복사
      fs.copyFileSync(filePath, thumbnailPath);
      return thumbnailPath;
    }
  }

  /**
   * 파일 삭제
   */
  deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * 여러 파일 삭제
   */
  deleteFiles(filePaths: string[]): void {
    filePaths.forEach((filePath) => {
      this.deleteFile(filePath);
    });
  }
}

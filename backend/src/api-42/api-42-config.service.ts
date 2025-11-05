import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

interface ApiKeyConfig {
  clientId: string;
  clientSecret: string;
  clientSecretNew?: string;  // Dual key: new secret for rotation
  lastUpdated?: string;
}

@Injectable()
export class Api42ConfigService {
  private configFilePath: string;
  private currentConfig: ApiKeyConfig;

  constructor(private configService: ConfigService) {
    // 설정 파일 경로 설정 (프로젝트 루트의 config 폴더)
    this.configFilePath = path.join(process.cwd(), 'config', 'api42-keys.json');
    this.initializeConfig();
  }

  private initializeConfig(): void {
    // config 디렉토리가 없으면 생성
    const configDir = path.dirname(this.configFilePath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // 설정 파일이 있으면 읽기, 없으면 .env에서 초기화
    if (fs.existsSync(this.configFilePath)) {
      try {
        const fileContent = fs.readFileSync(this.configFilePath, 'utf8');
        this.currentConfig = JSON.parse(fileContent);
        // console.log('API configuration loaded from file');

        // 예약된 키 활성화 체크
        this.checkAndActivateScheduledKey();
      } catch (error) {
        console.error('Error reading API config file:', error);
        this.loadFromEnv();
      }
    } else {
      this.loadFromEnv();
    }
  }

  private loadFromEnv(): void {
    // .env 파일에서 초기 설정 로드
    const newSecret = this.configService.get<string>('FORTYTWO_API_SECRET_NEW');
    this.currentConfig = {
      clientId: this.configService.get<string>('FORTYTWO_API_UID') || '',
      clientSecret: this.configService.get<string>('FORTYTWO_API_SECRET') || '',
      clientSecretNew: newSecret && newSecret.trim() ? newSecret : undefined,
      lastUpdated: new Date().toISOString(),
    };
    this.saveConfig();
    // console.log('API configuration initialized from .env file');
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(this.currentConfig, null, 2),
        'utf8'
      );
      // console.log('API configuration saved to file');
    } catch (error) {
      console.error('Error saving API config file:', error);
    }
  }

  private checkAndActivateScheduledKey(): void {
    // Dual key 방식에서는 스케줄링을 사용하지 않음
    // 대신 새 키와 현재 키 모두 사용 가능
  }

  // 현재 사용 중인 Client ID 반환
  getClientId(): string {
    return this.currentConfig.clientId;
  }

  // 현재 사용 중인 Client Secret 반환 (primary key)
  getClientSecret(): string {
    return this.currentConfig.clientSecret;
  }

  // 새로운 Client Secret 반환 (secondary key for rotation)
  getClientSecretNew(): string | undefined {
    return this.currentConfig.clientSecretNew;
  }

  // Dual key 방식: 두 키를 모두 반환
  getAllClientSecrets(): string[] {
    const secrets = [this.currentConfig.clientSecret];
    if (this.currentConfig.clientSecretNew) {
      secrets.push(this.currentConfig.clientSecretNew);
    }
    return secrets;
  }

  // 새로운 키를 secondary로 설정 (dual key 추가)
  setNewClientSecret(newSecret: string): void {
    this.currentConfig.clientSecretNew = newSecret;
    this.currentConfig.lastUpdated = new Date().toISOString();
    this.saveConfig();
    console.log('New client secret added for dual key rotation');
  }

  // 새 키를 primary로 승격 (키 교체 완료)
  promoteNewSecret(): void {
    if (this.currentConfig.clientSecretNew) {
      this.currentConfig.clientSecret = this.currentConfig.clientSecretNew;
      this.currentConfig.clientSecretNew = undefined;
      this.currentConfig.lastUpdated = new Date().toISOString();
      this.saveConfig();
      this.updateEnvFile();
      console.log('New secret promoted to primary');
    }
  }

  // .env 파일의 FORTYTWO_API_SECRET 및 FORTYTWO_CLIENT_SECRET 업데이트
  private updateEnvFile(): void {
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (!fs.existsSync(envPath)) {
        console.warn('.env file not found, skipping update');
        return;
      }

      let envContent = fs.readFileSync(envPath, 'utf8');

      // FORTYTWO_CLIENT_SECRET 업데이트 (OAuth용)
      const clientSecretRegex = /^FORTYTWO_CLIENT_SECRET=.*/m;
      if (clientSecretRegex.test(envContent)) {
        envContent = envContent.replace(
          clientSecretRegex,
          `FORTYTWO_CLIENT_SECRET=${this.currentConfig.clientSecret}`
        );
      }

      // FORTYTWO_CLIENT_SECRET_NEW 비우기
      const clientSecretNewRegex = /^FORTYTWO_CLIENT_SECRET_NEW=.*/m;
      if (clientSecretNewRegex.test(envContent)) {
        envContent = envContent.replace(
          clientSecretNewRegex,
          'FORTYTWO_CLIENT_SECRET_NEW=  # Optional: New secret key for rotation (fallback to current if verification fails)'
        );
      }

      // FORTYTWO_API_SECRET 업데이트 (API 호출용)
      const apiSecretRegex = /^FORTYTWO_API_SECRET=.*/m;
      if (apiSecretRegex.test(envContent)) {
        envContent = envContent.replace(
          apiSecretRegex,
          `FORTYTWO_API_SECRET=${this.currentConfig.clientSecret}`
        );
      }

      // FORTYTWO_API_SECRET_NEW 비우기
      const apiSecretNewRegex = /^FORTYTWO_API_SECRET_NEW=.*/m;
      if (apiSecretNewRegex.test(envContent)) {
        envContent = envContent.replace(
          apiSecretNewRegex,
          'FORTYTWO_API_SECRET_NEW=  # Optional: New secret key for rotation'
        );
      }

      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('.env file updated successfully (CLIENT_SECRET and API_SECRET)');
      console.warn('⚠️  서버를 재시작해야 OAuth 인증에 새 키가 적용됩니다.');
    } catch (error) {
      console.error('Failed to update .env file:', error);
    }
  }

  // 새 키 제거 (롤백)
  removeNewSecret(): void {
    this.currentConfig.clientSecretNew = undefined;
    this.currentConfig.lastUpdated = new Date().toISOString();
    this.saveConfig();
    console.log('New secret removed');
  }

  // Client ID 업데이트 (필요한 경우)
  updateClientId(newId: string): void {
    this.currentConfig.clientId = newId;
    this.currentConfig.lastUpdated = new Date().toISOString();
    this.saveConfig();
    // console.log('Client ID updated');
  }

  // 현재 설정 정보 반환 (관리자용)
  getConfigInfo(): any {
    return {
      clientId: this.currentConfig.clientId,
      currentSecretActive: !!this.currentConfig.clientSecret,
      currentSecretPreview: this.currentConfig.clientSecret ? `${this.currentConfig.clientSecret.substring(0, 10)}...` : '',
      newSecretActive: !!this.currentConfig.clientSecretNew,
      newSecretPreview: this.currentConfig.clientSecretNew ? `${this.currentConfig.clientSecretNew.substring(0, 10)}...` : '',
      isDualKeyMode: !!this.currentConfig.clientSecretNew,
      lastUpdated: this.currentConfig.lastUpdated,
    };
  }

  // 설정 파일 다시 로드
  reloadConfig(): void {
    this.initializeConfig();
    // console.log('API configuration reloaded');
  }
}
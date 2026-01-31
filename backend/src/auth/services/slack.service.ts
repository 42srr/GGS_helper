import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SlackVerification } from '../entities/slack-verification.entity';
import axios from 'axios';

@Injectable()
export class SlackService {
  constructor(
    @InjectRepository(SlackVerification)
    private slackVerificationRepository: Repository<SlackVerification>,
  ) {}

  /**
   * 6자리 랜덤 인증 코드 생성
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 슬랙에서 인트라 ID로 사용자 검색
   */
  private async findSlackUserByIntraId(intraId: string): Promise<string | null> {
    try {
      const response = await axios.get('https://slack.com/api/users.list', {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        },
      });

      if (!response.data.ok) {
        throw new Error('Failed to fetch Slack users');
      }

      // 슬랙 사용자 목록에서 인트라 ID와 일치하는 사용자 찾기
      // display_name 또는 real_name에서 인트라 ID 검색
      const user = response.data.members.find(
        (member: any) =>
          member.profile?.display_name === intraId ||
          member.profile?.real_name === intraId ||
          member.name === intraId,
      );

      return user ? user.id : null;
    } catch (error) {
      console.error('Error finding Slack user:', error);
      return null;
    }
  }

  /**
   * 슬랙 DM으로 인증 코드 전송
   */
  private async sendSlackDM(slackUserId: string, verificationCode: string): Promise<void> {
    try {
      // DM 채널 열기
      const channelResponse = await axios.post(
        'https://slack.com/api/conversations.open',
        {
          users: slackUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!channelResponse.data.ok) {
        throw new Error('Failed to open DM channel');
      }

      const channelId = channelResponse.data.channel.id;

      // 메시지 전송
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channelId,
          text: `🔐 GGS Helper 회원가입 인증 코드\n\n인증 코드: *${verificationCode}*\n\n이 코드는 5분간 유효합니다.`,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('Error sending Slack DM:', error);
      throw new BadRequestException('슬랙 메시지 전송에 실패했습니다');
    }
  }

  /**
   * 인증 코드 생성 및 슬랙 DM 전송
   */
  async sendVerificationCode(intraId: string): Promise<void> {
    // 슬랙에서 사용자 검색
    const slackUserId = await this.findSlackUserByIntraId(intraId);

    if (!slackUserId) {
      throw new NotFoundException(
        '슬랙에서 해당 인트라 ID를 찾을 수 없습니다. 슬랙 프로필의 표시 이름이 인트라 ID와 일치하는지 확인해주세요.',
      );
    }

    // 기존 미인증 코드 삭제
    await this.slackVerificationRepository.delete({
      intraId,
      isVerified: false,
    });

    // 만료된 코드 삭제
    await this.slackVerificationRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    // 인증 코드 생성
    const verificationCode = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5분 후 만료

    // DB에 저장
    const verification = this.slackVerificationRepository.create({
      intraId,
      verificationCode,
      slackUserId,
      expiresAt,
    });
    await this.slackVerificationRepository.save(verification);

    // 슬랙 DM 전송
    await this.sendSlackDM(slackUserId, verificationCode);
  }

  /**
   * 인증 코드 검증
   */
  async verifyCode(intraId: string, code: string): Promise<boolean> {
    const verification = await this.slackVerificationRepository.findOne({
      where: {
        intraId,
        verificationCode: code,
        isVerified: false,
      },
    });

    if (!verification) {
      return false;
    }

    // 만료 확인
    if (verification.expiresAt < new Date()) {
      await this.slackVerificationRepository.delete(verification.id);
      return false;
    }

    // 인증 완료 표시
    verification.isVerified = true;
    await this.slackVerificationRepository.save(verification);

    return true;
  }

  /**
   * 인증된 코드인지 확인 (회원가입 시 사용)
   */
  async isCodeVerified(intraId: string): Promise<boolean> {
    const verification = await this.slackVerificationRepository.findOne({
      where: {
        intraId,
        isVerified: true,
      },
    });

    return !!verification;
  }

  /**
   * 인증 완료 후 데이터 삭제
   */
  async deleteVerification(intraId: string): Promise<void> {
    await this.slackVerificationRepository.delete({ intraId });
  }
}

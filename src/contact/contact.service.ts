import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { SendFormInformationDto } from './dtos/send-form-information.dto';

@Injectable()
export class ContactService {
	private readonly logger = new Logger(ContactService.name);
	// timestamps in ms of sent emails
	private sendTimestamps: number[] = [];
	private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
	private readonly MAX_EMAILS_PER_WINDOW = 20;

	constructor(
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService,
	) {}

	private pruneOld() {
		const cutoff = Date.now() - this.WINDOW_MS;
		this.sendTimestamps = this.sendTimestamps.filter(ts => ts >= cutoff);
	}

	async sendFormInformation(payload: SendFormInformationDto) {
		this.pruneOld();
		if (this.sendTimestamps.length >= this.MAX_EMAILS_PER_WINDOW) {
			throw new HttpException('Rate limit exceeded: too many emails sent. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
		}

		const recipient = this.configService.get<string>('EMAIL_USER_GET_INFO');
		if (!recipient) {
			this.logger.error('EMAIL_USER_GET_INFO not configured');
			throw new HttpException('Recipient email not configured', HttpStatus.INTERNAL_SERVER_ERROR);
		}

const subject = payload.subject || `Yêu cầu đăng ký từ ${payload.fullName || 'Người dùng'}`;
    const html = `
      <h3>Yêu cầu đăng ký / Liên hệ</h3>
      <p><strong>Họ và tên:</strong> ${payload.fullName || '—'}</p>
      <p><strong>Email:</strong> ${payload.email || '—'}</p>
      <p><strong>Phone:</strong> ${payload.phone || '—'}</p>
      <p><strong>Phòng ban liên hệ:</strong> ${payload.department || '—'}</p>
      <p><strong>Tiêu đề:</strong> ${payload.subject || '—'}</p>
			<p><strong>Nội dung:</strong></p>
			<div>${payload.message || '—'}</div>
		`;

		try {
			await this.mailerService.sendMail({
				to: recipient,
				subject,
				html,
			});

			// record timestamp only on success
			this.sendTimestamps.push(Date.now());
			return true;
		} catch (err) {
			this.logger.error('Failed to send contact email', err as any);
			throw new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}

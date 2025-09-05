import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: NestMailerService) {}

  async sendVerificationEmail(to: string, verificationUrl: string) {
    console.log('to', to);
    console.log('verificationUrl', verificationUrl);
    const message = `Please verify your email by clicking the link: ${verificationUrl}`;
    await this.mailer.sendMail({
      to,
      from: process.env.EMAIL_FROM || 'no-reply@renamie.com',
      subject: 'Verify your email address',
      text: message,
      // html: `<p>Please verify your email by clicking the link below:</p>
      //        <p><a href="${verificationUrl}">Verify Email</a></p>`,
    });
  }
}

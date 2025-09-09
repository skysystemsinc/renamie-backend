import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: NestMailerService) {}

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ) {
    await this.mailer.sendMail({
      to,
      from: process.env.EMAIL_FROM || 'no-reply@renamie.com',
      subject,
      text,
      html,
    });
  }

  async sendVerificationEmail(to: string, verificationUrl: string) {
    const subject = 'Verify your email address - Renamie';
    const text = `You have successfully registered your account. 
    Please verify your email by clicking the link: ${verificationUrl}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Renamie!</h2>
        <p>Thank you for registering with us.</p>
        <p>Please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
      </div>
    `;
    await this.sendEmail(to, subject, text, html);
  }

  async sendUpdateYourPassword(to: string, verificationUrl: string) {
    const subject = 'Update Your Password - Renamie';
    const text = `You have successfully registered your account. 
    Please Update Your Password by clicking the link: ${verificationUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Renamie!</h2>
        <p>Hello,</p>
      <p>We received a request to update your password. You can securely set a new password by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Update Password
          </a>
        </div>
      </div>
    `;
    await this.sendEmail(to, subject, text, html);
  }
}

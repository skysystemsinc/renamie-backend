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
    try {
      await this.mailer.sendMail({
        to,
        from: process.env.EMAIL_FROM || 'no-reply@renamie.com',
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error(' Error sending email:', error);
      throw error;
    }
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
    const subject = 'Reset your password - Renamie';
    const text = `We received a request to reset your password. 
  Please set a new password by clicking the link: ${verificationUrl}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset your password</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. You can securely set a new one by clicking below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
    </div>
  `;
    await this.sendEmail(to, subject, text, html);
  }
}

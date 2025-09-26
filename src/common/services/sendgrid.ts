import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import * as SendGrid from '@sendgrid/mail';
import { default as SendGrid } from '@sendgrid/mail';

@Injectable()
export class SendgridService {
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(' SENDGRID_API_KEY is missing');
    }
    console.log('api key', apiKey);
    SendGrid.setApiKey(apiKey);
  }

  async sendMail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<void> {
    const msg: SendGrid.MailDataRequired = {
      to,
      from: process.env.SENDGRID_EMAIL_FROM || 'allie.renamie@gmail.com',
      subject,
      text,
      html,
    };

    try {
      await SendGrid.send(msg);
      console.log(`Email successfully sent to ${to} via SendGrid.`);
    } catch (error) {
      console.error('SendGrid Error:', error.response?.body || error.message);
      throw new InternalServerErrorException(
        'Failed to send email via SendGrid.',
      );
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
    await this.sendMail(to, subject, text, html);
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
    await this.sendMail(to, subject, text, html);
  }
}

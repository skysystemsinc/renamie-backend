import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { default as SendGrid } from '@sendgrid/mail';
import { emailConstant } from 'src/utils/constant';

interface DynamicDataType {
  userName: string;
  verificationLink?: string;
  totalFiles?: number;
  folderName?: string;
  completedFiles?: number;
  failedFiles?: number;
}

@Injectable()
export class SendgridService {
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('SENDGRID_API_KEY is missing');
    }
    this.fromEmail =
      process.env.SENDGRID_EMAIL_FROM || 'allie.renamie@gmail.com';
    SendGrid.setApiKey(apiKey);
  }

  async sendTemplateMail(
    to: string,
    templateId: string,
    dynamicData: DynamicDataType,
  ): Promise<void> {
    try {
      const msg: SendGrid.MailDataRequired = {
        to: to,
        from: this.fromEmail,
        templateId,
        dynamicTemplateData: dynamicData,
      };
      const result = await SendGrid.send(msg);
      const response = result[0];
      // console.log(
      //   `Email accepted by SendGrid (Status: ${response.statusCode}) for recipient ${to} using template ${templateId}.`,
      // );
    } catch (error) {
      const errorDetails = error.response?.body?.errors || error.message;
      console.error(
        'Error sending email. Details:',
        JSON.stringify(errorDetails),
      );
      throw new InternalServerErrorException(
        'Failed to send email via SendGrid. Check logs for API details.',
      );
    }
  }

  async sendVerificationEmail(
    to: string,
    userName: string,
    verificationUrl: string,
  ) {
    try {
      await this.sendTemplateMail(to, emailConstant.emailTemplateId, {
        userName: userName,
        verificationLink: verificationUrl,
      });
      // console.log(`Verification email successfully sent to ${to}.`);
    } catch (error) {
      console.error(`Failed to send verification email to ${to}.`);
      throw error;
    }
  }

  async sendResetPasswordEmail(to: string, userName: string, resetUrl: string) {
    try {
      await this.sendTemplateMail(to, emailConstant.resetPassTempId, {
        userName: userName,
        verificationLink: resetUrl,
      });
      // console.log(`Password reset email successfully sent to ${to}.`);
    } catch (error) {
      console.error(`Failed to send password reset email to ${to}.`);
      throw error;
    }
  }

  async sendPasswordChangedEmail(
    to: string,
    userName: string,
    loginUrl: string,
  ) {
    try {
      await this.sendTemplateMail(to, emailConstant.changedPasswordTempId, {
        userName: userName,
        verificationLink: loginUrl,
      });
    } catch (error) {
      console.error(`Failed to send changed password email to ${to}.`);
      throw error;
    }
  }

  // Files extraction completed
  async sendExtractionCompletedEmail(
    to: string,
    userName: string,
    folderName?: string,
    totalFiles?: number,
    completedFiles?: number,
    failedFiles?: number,
  ) {
    try {
      await this.sendTemplateMail(to, emailConstant.fileProcessedTempId, {
        userName: userName,
        totalFiles: totalFiles,
        folderName: folderName,
        completedFiles: completedFiles,
        failedFiles: failedFiles,
      });
    } catch (error) {
      console.error(`Failed to send changed password email to ${to}.`);
      throw error;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.logger.log('Email service initialized');
    } else {
      this.logger.warn('SMTP not configured — emails will not be sent');
    }
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

    if (!this.transporter) {
      this.logger.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_USER || 'noreply@hackhub.com',
      to: email,
      subject: 'Reset your HackHub password',
      text: `Click the following link to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>`,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }
}

/**
 * Email Service
 * Handles sending applications with CV and cover letter
 */

import nodemailer from 'nodemailer';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

class EmailService {
  private transporter: any;

  constructor() {
    // Initialize email transporter
    // Using environment variables for configuration
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };

    // Only initialize if credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
    }
  }

  /**
   * Send application email
   */
  async sendApplicationEmail(
    userId: string,
    recruiterEmail: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    coverLetterContent: string,
    cvBuffer?: Buffer
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.transporter) {
        return {
          success: false,
          error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in environment.'
        };
      }

      // Build email body
      const emailBody = `
Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}.

${coverLetterContent}

I have attached my resume for your review. I would welcome the opportunity to discuss how my skills and experience align with your team's needs.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
${candidateName}
`;

      // Prepare attachments
      const attachments = [];
      if (cvBuffer) {
        attachments.push({
          filename: `${candidateName.replace(/\s+/g, '_')}_CV.pdf`,
          content: cvBuffer,
          contentType: 'application/pdf'
        });
      }

      // Send email
      const mailOptions: EmailOptions = {
        to: recruiterEmail,
        subject: `Application for ${jobTitle} Position at ${companyName}`,
        body: emailBody,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: mailOptions.to,
        subject: mailOptions.subject,
        text: mailOptions.body,
        attachments: mailOptions.attachments
      });

      // Log email sent
      this.logEmailSent(userId, recruiterEmail);

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send quick application email (without CV attachment)
   */
  async sendQuickApplicationEmail(
    userId: string,
    recruiterEmail: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    coverLetterContent: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    return this.sendApplicationEmail(
      userId,
      recruiterEmail,
      candidateName,
      jobTitle,
      companyName,
      coverLetterContent
    );
  }

  /**
   * Log email sent
   */
  private logEmailSent(userId: string, recruiterEmail: string): void {
    try {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO email_logs (user_id, recipient_email)
        VALUES (?, ?)
      `);
      stmt.run(userId, recruiterEmail);
    } catch (error) {
      console.error('[EmailService] Error logging email:', error);
    }
  }

  /**
   * Check if email was already sent to this recruiter
   */
  hasEmailBeenSent(userId: string, recruiterEmail: string): boolean {
    try {
      const stmt = db.prepare(`
        SELECT COUNT(*) as count FROM email_logs
        WHERE user_id = ? AND recipient_email = ?
      `);
      const result = stmt.get(userId, recruiterEmail) as any;
      return result.count > 0;
    } catch (error) {
      console.error('[EmailService] Error checking email log:', error);
      return false;
    }
  }

  /**
   * Get email statistics for user
   */
  getEmailStats(userId: string): {
    totalSent: number;
    uniqueRecipients: number;
  } {
    try {
      const stmt = db.prepare(`
        SELECT COUNT(*) as total, COUNT(DISTINCT recipient_email) as unique_recipients
        FROM email_logs
        WHERE user_id = ?
      `);
      const result = stmt.get(userId) as any;
      return {
        totalSent: result.total,
        uniqueRecipients: result.unique_recipients
      };
    } catch (error) {
      console.error('[EmailService] Error getting email stats:', error);
      return { totalSent: 0, uniqueRecipients: 0 };
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!this.transporter) {
        return {
          success: false,
          message: 'Email service not configured'
        };
      }

      await this.transporter.verify();
      return {
        success: true,
        message: 'Email configuration is valid'
      };
    } catch (error) {
      console.error('[EmailService] Error testing email:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const emailService = new EmailService();

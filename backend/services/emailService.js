import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export class EmailService {
  /**
   * Sends an email via Resend API
   * @param {string} toEmail 
   * @param {string} subject 
   * @param {string} htmlContent 
   * @returns {Promise<boolean>}
   */
  static async sendEmail(toEmail, subject, htmlContent) {
    if (!RESEND_API_KEY || RESEND_API_KEY === 'your_resend_api_key_here') {
      console.log('==================================================');
      console.log(`SIMULATED EMAIL SENT (Resend Key missing)`);
      console.log(`To:      ${toEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content Preview: ${htmlContent.substring(0, 200)}...`);
      console.log('==================================================');
      return true;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Carbonlytix <onboarding@resend.dev>', // Resend free tier sends from this domain
          to: [toEmail],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Resend API responded with status ${response.status}: ${errText}`);
      }

      const result = await response.json();
      console.log(`Email sent successfully via Resend. ID: ${result.id}`);
      return true;
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      return false;
    }
  }

  /**
   * Sends a styled welcome email
   */
  static async sendWelcomeEmail(toEmail, fullName) {
    const subject = 'Welcome to Carbonlytix – Let\'s Save the Planet together!';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-xl">
        <h2 style="color: #10b981; margin-bottom: 20px;">Welcome to Carbonlytix, ${fullName}!</h2>
        <p>Thank you for taking a step towards planetary awareness and carbon footprints offset.</p>
        <p>With Carbonlytix, you can:</p>
        <ul>
          <li><strong>Log activities</strong>: Track transport, electricity, diet, water, and waste footprints.</li>
          <li><strong>Define goals</strong>: Set carbon emission limits and get notified if you exceed them.</li>
          <li><strong>Compete in challenges</strong>: Earn XP, unlock badges, and level up your Eco Level.</li>
          <li><strong>AI Insights</strong>: Chat with EcoChat and receive personalized green tips.</li>
        </ul>
        <p>Start logging your first footprint today at <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/calculator" style="color: #10b981; font-weight: bold; text-decoration: none;">Log Footprint</a>.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 12px; color: #64748b;">This email was sent by the Carbonlytix Climate Platform.</p>
      </div>
    `;
    return this.sendEmail(toEmail, subject, html);
  }

  /**
   * Sends warning when carbon target is breached
   */
  static async sendGoalBreachWarning(toEmail, category, limit, currentAmount) {
    const subject = `⚠️ Carbonlytix Alert: ${category.toUpperCase()} Budget Breach Warning`;
    const percent = Math.round((currentAmount / limit) * 100);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ef4444; border-radius: 8px;">
        <h2 style="color: #ef4444; margin-bottom: 20px;">Budget Limit Warning!</h2>
        <p>We are writing to let you know that your carbon emissions budget for <strong>${category}</strong> has reached <strong>${percent}%</strong> of its monthly limit.</p>
        <p><strong>Limit:</strong> ${limit} kg CO2e</p>
        <p><strong>Current:</strong> ${currentAmount.toFixed(1)} kg CO2e</p>
        <p>Consider implementing carbon-saving actions, such as walking instead of driving or reducing meat consumption, to stay within your targets.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Check Dashboard</a>
      </div>
    `;
    return this.sendEmail(toEmail, subject, html);
  }
}

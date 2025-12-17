import nodemailer from 'nodemailer';

// Create transporter with Gmail SMTP using explicit settings
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Use App Password
    },
});

interface BookingEmailData {
    recipientEmail: string;
    recipientName: string;
    bookingDate: string;
    bookingTime: string;
    consultationType: string;
    purpose: string;
    isCustomRequest?: boolean;
}

export const sendBookingConfirmationEmail = async (data: BookingEmailData) => {
    const {
        recipientEmail,
        recipientName,
        bookingDate,
        bookingTime,
        consultationType,
        purpose,
        isCustomRequest,
    } = data;

    const subject = isCustomRequest
        ? 'Custom Appointment Request Received - one-EKA Solutions'
        : 'Booking Confirmation - one-EKA Solutions';

    const htmlContent = isCustomRequest
        ? `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #8B0000 0%, #B22222 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .label { color: #666; }
                    .value { font-weight: bold; color: #333; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .note { background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ffc107; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Custom Appointment Request Received</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${recipientName},</p>
                        <p>Thank you for your custom appointment request. We have received your preferred dates and times.</p>
                        
                        <div class="booking-details">
                            <h3>Request Details</h3>
                            <div class="detail-row">
                                <span class="label">Preferred Date:</span>
                                <span class="value">${bookingDate}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Preferred Time:</span>
                                <span class="value">${bookingTime}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Consultation Type:</span>
                                <span class="value">${consultationType}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Purpose:</span>
                                <span class="value">${purpose}</span>
                            </div>
                        </div>
                        
                        <div class="note">
                            <strong>📋 Next Steps:</strong><br>
                            Our team will review your request and confirm an available slot that works for you. You will receive another email with the confirmed date and time shortly.
                        </div>
                        
                        <p>If you have any questions, please don't hesitate to contact us.</p>
                        <p>Best regards,<br><strong>one-EKA Solutions Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} one-EKA Solutions. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
        : `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #8B0000 0%, #B22222 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .label { color: #666; }
                    .value { font-weight: bold; color: #333; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .success-icon { font-size: 48px; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="success-icon">✓</div>
                        <h1>Booking Confirmed!</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${recipientName},</p>
                        <p>Your speaking assessment consultation has been successfully booked with <strong>one-EKA Solutions</strong>.</p>
                        
                        <div class="booking-details">
                            <h3>Booking Details</h3>
                            <div class="detail-row">
                                <span class="label">Date:</span>
                                <span class="value">${bookingDate}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Time:</span>
                                <span class="value">${bookingTime}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Consultation Type:</span>
                                <span class="value">${consultationType}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Purpose:</span>
                                <span class="value">${purpose}</span>
                            </div>
                        </div>
                        
                        <p><strong>Important:</strong> Please check your email closer to the appointment date for any additional instructions or documents you may need to prepare.</p>
                        
                        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
                        
                        <p>We look forward to helping you with your immigration journey!</p>
                        <p>Best regards,<br><strong>one-EKA Solutions Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} one-EKA Solutions. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    try {
        await transporter.sendMail({
            from: `"one-EKA Solutions" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`Booking confirmation email sent to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        return false;
    }
};

interface BookingStatusUpdateData {
    recipientEmail: string;
    recipientName: string;
    bookingDate: string;
    bookingTime: string;
    consultationType: string;
    purpose: string;
    status: 'confirmed' | 'cancelled' | 'completed';
}

export const sendBookingStatusUpdateEmail = async (data: BookingStatusUpdateData) => {
    const {
        recipientEmail,
        recipientName,
        bookingDate,
        bookingTime,
        consultationType,
        purpose,
        status,
    } = data;

    let subject = '';
    let headerColor = '';
    let headerTitle = '';
    let headerIcon = '';
    let bodyMessage = '';

    switch (status) {
        case 'confirmed':
            subject = 'Your Booking Has Been Confirmed! - one-EKA Solutions';
            headerColor = 'linear-gradient(135deg, #28a745 0%, #218838 100%)';
            headerTitle = 'Booking Confirmed!';
            headerIcon = '✓';
            bodyMessage = 'Great news! Your speaking assessment consultation has been confirmed with <strong>one-EKA Solutions</strong>.';
            break;
        case 'cancelled':
            subject = 'Booking Cancelled - one-EKA Solutions';
            headerColor = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
            headerTitle = 'Booking Cancelled';
            headerIcon = '✕';
            bodyMessage = 'We regret to inform you that your booking has been cancelled. If you believe this was a mistake or would like to reschedule, please contact us.';
            break;
        case 'completed':
            subject = 'Thank You for Your Consultation - one-EKA Solutions';
            headerColor = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
            headerTitle = 'Consultation Completed';
            headerIcon = '★';
            bodyMessage = 'Thank you for completing your consultation with us. We hope our service was helpful for your immigration journey.';
            break;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: ${headerColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .label { color: #666; }
                .value { font-weight: bold; color: #333; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .status-icon { font-size: 48px; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="status-icon">${headerIcon}</div>
                    <h1>${headerTitle}</h1>
                </div>
                <div class="content">
                    <p>Dear ${recipientName},</p>
                    <p>${bodyMessage}</p>
                    
                    <div class="booking-details">
                        <h3>Booking Details</h3>
                        <div class="detail-row">
                            <span class="label">Date:</span>
                            <span class="value">${bookingDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Time:</span>
                            <span class="value">${bookingTime}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Consultation Type:</span>
                            <span class="value">${consultationType}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Purpose:</span>
                            <span class="value">${purpose}</span>
                        </div>
                    </div>
                    
                    ${status === 'confirmed' ? `
                        <p><strong>Important:</strong> Please mark your calendar and be ready at the scheduled time. You will receive joining instructions closer to the date.</p>
                    ` : status === 'cancelled' ? `
                        <p>If you'd like to book a new appointment, please visit our website or contact us directly.</p>
                    ` : `
                        <p>If you have any follow-up questions, please don't hesitate to reach out to us.</p>
                    `}
                    
                    <p>Best regards,<br><strong>one-EKA Solutions Team</strong></p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} one-EKA Solutions. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        await transporter.sendMail({
            from: `"one-EKA Solutions" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`Booking status update email (${status}) sent to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending booking status update email:', error);
        return false;
    }
};

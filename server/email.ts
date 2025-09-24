import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not set, email functionality will be disabled");
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    console.error("Email service not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const result = await resend.emails.send({
      from: params.from || 'VacationRentalOahu <noreply@vacationrentaloahu.co>',
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (result.error) {
      console.error('Email send error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function generateBookingConfirmationEmail(booking: any, guest: any, property: any) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation - VacationRentalOahu.co</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #FF5A5F; margin: 0;">🌴 VacationRentalOahu.co</h1>
        <h2 style="color: #333; margin: 10px 0;">Booking Confirmation</h2>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin: 0 0 15px 0;">Aloha ${guest.first_name}!</h3>
        <p style="color: #666; line-height: 1.6;">
          Your booking has been confirmed! We can't wait to welcome you to our Beach House Oahu tropical property.
        </p>
      </div>

      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #333; margin: 0 0 15px 0;">Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Property:</td>
            <td style="padding: 8px 0; color: #333; font-weight: 500;">${property.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Check-in:</td>
            <td style="padding: 8px 0; color: #333; font-weight: 500;">${booking.start_date} at ${property.check_in_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Check-out:</td>
            <td style="padding: 8px 0; color: #333; font-weight: 500;">${booking.end_date} at ${property.check_out_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Guests:</td>
            <td style="padding: 8px 0; color: #333; font-weight: 500;">${booking.guests}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Total:</td>
            <td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 18px;">$${booking.total}</td>
          </tr>
        </table>
      </div>

      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #2d5a2d; margin: 0 0 15px 0;">🔑 Check-in Information</h3>
        <p style="color: #2d5a2d; line-height: 1.6;">
          The property features self check-in with a smart lock. You'll receive detailed check-in instructions 
          via email 24 hours before your arrival date.
        </p>
      </div>

      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #856404; margin: 0 0 15px 0;">📍 Property Address</h3>
        <p style="color: #856404; line-height: 1.6; margin: 0;">
          ${property.address}<br>
          Honolulu, HI 96815
        </p>
      </div>

      <div style="text-align: center; padding: 20px 0;">
        <p style="color: #666; margin: 0 0 15px 0;">
          Questions? Contact us at <a href="mailto:hello@vacationrentaloahu.co" style="color: #FF5A5F;">hello@vacationrentaloahu.co</a>
        </p>
        <p style="color: #999; font-size: 14px; margin: 0;">
          VacationRentalOahu.co | Licensed Vacation Rental #TVU-2024-001
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Aloha ${guest.first_name}!
    
    Your booking has been confirmed at ${property.title}.
    
    Check-in: ${booking.start_date} at ${property.check_in_time}
    Check-out: ${booking.end_date} at ${property.check_out_time}
    Guests: ${booking.guests}
    Total: $${booking.total}
    
    You'll receive check-in instructions 24 hours before arrival.
    
    Questions? Contact us at hello@vacationrentaloahu.co
    
    VacationRentalOahu.co
  `;

  return { html, text };
}

export function generateContactReplyEmail(name: string, originalMessage: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Thank you for contacting us - VacationRentalOahu.co</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #FF5A5F; margin: 0;">🌴 VacationRentalOahu.co</h1>
        <h2 style="color: #333; margin: 10px 0;">Thank you for reaching out!</h2>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin: 0 0 15px 0;">Aloha ${name}!</h3>
        <p style="color: #666; line-height: 1.6;">
          Thank you for contacting us! We've received your message and will get back to you within 24 hours.
        </p>
      </div>

      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #333; margin: 0 0 15px 0;">Your Message:</h3>
        <p style="color: #666; line-height: 1.6; font-style: italic;">
          "${originalMessage}"
        </p>
      </div>

      <div style="text-align: center; padding: 20px 0;">
        <p style="color: #666; margin: 0 0 15px 0;">
          In the meantime, feel free to explore our <a href="https://vacationrentaloahu.co" style="color: #FF5A5F;">Beach House Oahu property</a> 
          and book your perfect Hawaiian getaway!
        </p>
        <p style="color: #999; font-size: 14px; margin: 0;">
          VacationRentalOahu.co | hello@vacationrentaloahu.co | (208) 995-9516
        </p>
      </div>
    </body>
    </html>
  `;

  return { html };
}

// Enhanced Email System for Phase 2

// Pre-Arrival Reminder Email (3 days before check-in)
export function generatePreArrivalEmail(booking: any, guest: any, property: any) {
  const checkInDate = new Date(booking.start_date);
  const checkOutDate = new Date(booking.end_date);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Hawaiian Getaway is Almost Here! - VacationRentalOahu.co</title>
      <style>
        .highlight { background: linear-gradient(120deg, #a8e6cf 0%, #88d8a8 100%); padding: 2px 8px; border-radius: 4px; }
        .amenity-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
        .amenity-item { display: flex; align-items: center; padding: 8px; background: #f0f9ff; border-radius: 6px; }
      </style>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; padding: 30px 20px; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 28px;">🏖️ Aloha ${guest.first_name}!</h1>
        <h2 style="margin: 10px 0; font-weight: 300; opacity: 0.9;">Your Paradise Awaits</h2>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(45deg, #ff6b6b, #ee5a52); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 24px;">⏰ Just 3 Days to Go!</h3>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">
            Check-in: <span class="highlight" style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-weight: bold;">
              ${checkInDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #28a745;">
          <h3 style="color: #28a745; margin: 0 0 15px 0; display: flex; align-items: center;">
            🏡 Your Beach House Oahu Details
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div><strong style="color: #495057;">Property:</strong><br>${property.title}</div>
            <div><strong style="color: #495057;">Location:</strong><br>Kaneohe Bay, Oahu</div>
            <div><strong style="color: #495057;">Check-in:</strong><br>${property.check_in_time} on ${checkInDate.toDateString()}</div>
            <div><strong style="color: #495057;">Check-out:</strong><br>${property.check_out_time} on ${checkOutDate.toDateString()}</div>
          </div>
          <p style="margin: 15px 0 0 0; padding: 15px; background: white; border-radius: 6px; color: #666;">
            <strong>🏠 Full Address:</strong> ${property.address}<br>
            <em>You'll receive detailed check-in instructions via email on your arrival day.</em>
          </p>
        </div>

        <div style="background: linear-gradient(135deg, #74b9ff, #0984e3); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0;">🌺 What Awaits You</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px;">🏖️</div>
              <div style="font-size: 14px;">Private Beach Access</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px;">🏖️</div>
              <div style="font-size: 14px;">Beach Activities</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px;">🌅</div>
              <div style="font-size: 14px;">Ocean Views</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px;">🏄‍♂️</div>
              <div style="font-size: 14px;">Water Sports</div>
            </div>
          </div>
        </div>

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #ffeaa7;">
          <h3 style="color: #856404; margin: 0 0 15px 0;">📋 Pre-Arrival Checklist</h3>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>Pack reef-safe sunscreen (required by Hawaiian law)</li>
            <li>Bring your camera for those Instagram-worthy sunrises</li>
            <li>Download the Hawaii travel app for local recommendations</li>
            <li>Check flight status and arrival times</li>
            <li>Review our house rules and amenities guide</li>
          </ul>
        </div>

        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #2d5a2d; margin: 0 0 15px 0;">🗺️ Local Recommendations</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong style="color: #2d5a2d;">🍽️ Dining:</strong>
              <ul style="margin: 5px 0; padding-left: 15px; color: #2d5a2d; font-size: 14px;">
                <li>Roy's Waikiki (Fine Dining)</li>
                <li>Giovanni's Shrimp Truck</li>
                <li>Lanikai Brewing Company</li>
              </ul>
            </div>
            <div>
              <strong style="color: #2d5a2d;">🏝️ Activities:</strong>
              <ul style="margin: 5px 0; padding-left: 15px; color: #2d5a2d; font-size: 14px;">
                <li>Hanauma Bay Snorkeling</li>
                <li>Diamond Head Hike</li>
                <li>Polynesian Cultural Center</li>
              </ul>
            </div>
          </div>
        </div>

        <div style="text-align: center; padding: 25px 0; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0 0 15px 0; font-size: 16px;">
            Questions before arrival? We're here to help! 🤙
          </p>
          <p style="margin: 0;">
            <a href="mailto:hello@vacationrentaloahu.co" 
               style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Contact Your Hosts
            </a>
          </p>
          <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
            VacationRentalOahu.co | Licensed Vacation Rental #TVU-2024-001<br>
            📧 hello@vacationrentaloahu.co | 📱 (208) 995-9516
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Aloha ${guest.first_name}!
    
    Your Hawaiian getaway is just 3 days away! We're so excited to welcome you to our Beach House Oahu property.
    
    BOOKING DETAILS:
    Property: ${property.title}
    Check-in: ${checkInDate.toDateString()} at ${property.check_in_time}
    Check-out: ${checkOutDate.toDateString()} at ${property.check_out_time}
    Address: ${property.address}
    
    WHAT TO EXPECT:
    - Private beach access and water activities
    - Ocean views from every room
    - Professional concierge services
    - Water sports equipment included
    
    PRE-ARRIVAL CHECKLIST:
    ✓ Pack reef-safe sunscreen
    ✓ Bring your camera
    ✓ Check flight status
    ✓ Review house rules
    
    Questions? Contact us at hello@vacationrentaloahu.co or (208) 995-9516
    
    Mahalo,
    Your VacationRentalOahu.co Team
  `;

  return { html, text };
}

// Check-in Instructions Email (day of arrival)
export function generateCheckInInstructionsEmail(booking: any, guest: any, property: any) {
  const accessCode = "4815"; // This would be dynamic in a real system
  const wifiPassword = "AlohaGuest2024"; // This would be dynamic
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Check-in Instructions - Your Key to Paradise - VacationRentalOahu.co</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f0f8ff;">
      <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); text-align: center; padding: 25px; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 32px;">🔑 Welcome Day!</h1>
        <h2 style="margin: 10px 0; font-weight: 300; opacity: 0.9;">Check-in Instructions</h2>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.15);">
        <div style="background: linear-gradient(45deg, #ff6b6b, #ee5a52); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 24px;">🎉 Today's the Day, ${guest.first_name}!</h3>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">
            Your Beach House Oahu Hawaiian property is ready and waiting for you
          </p>
        </div>

        <div style="background: #fff5f5; padding: 25px; border-radius: 10px; margin-bottom: 25px; border: 2px solid #fecaca;">
          <h3 style="color: #dc2626; margin: 0 0 20px 0; text-align: center; font-size: 22px;">
            🏠 PROPERTY ADDRESS
          </h3>
          <div style="text-align: center; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; font-weight: bold; color: #1a202c; margin: 0 0 10px 0;">${property.address}</p>
            <p style="color: #666; margin: 0; font-size: 16px;">Kaneohe Bay, Oahu, Hawaii 96815</p>
            <a href="https://maps.google.com/?q=${encodeURIComponent(property.address)}" 
               style="display: inline-block; margin-top: 15px; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              📍 Open in Google Maps
            </a>
          </div>
        </div>

        <div style="background: #f0f9ff; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 20px 0;">
            🚪 SMART LOCK ACCESS
          </h3>
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e0e7ff;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
              <div style="text-align: center;">
                <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">ACCESS CODE</p>
                <p style="font-size: 32px; font-weight: bold; color: #1e40af; margin: 0; letter-spacing: 4px;">${accessCode}</p>
              </div>
              <div style="text-align: center;">
                <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">CHECK-IN TIME</p>
                <p style="font-size: 24px; font-weight: bold; color: #059669; margin: 0;">${property.check_in_time}</p>
              </div>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border: 1px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-weight: bold; text-align: center;">
                ⚠️ Please do NOT share this code with others
              </p>
            </div>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 6px;">
            <h4 style="color: #065f46; margin: 0 0 10px 0;">How to Use the Smart Lock:</h4>
            <ol style="color: #065f46; margin: 0; padding-left: 20px;">
              <li>Approach the front door - the keypad will light up</li>
              <li>Enter the 4-digit code: <strong>${accessCode}</strong></li>
              <li>Press the checkmark (✓) button</li>
              <li>Turn the handle when you hear the unlock sound</li>
              <li>The lock will automatically re-lock after 30 seconds</li>
            </ol>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 20px 0;">📶 WIFI & ESSENTIALS</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #d1d5db;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">WIFI NETWORK</p>
              <p style="font-weight: bold; color: #1f2937; margin: 0;">VacationRental_Guest</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #d1d5db;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">WIFI PASSWORD</p>
              <p style="font-weight: bold; color: #1f2937; margin: 0;">${wifiPassword}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #d1d5db;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">EMERGENCY CONTACT</p>
              <p style="font-weight: bold; color: #1f2937; margin: 0;">(208) 995-9516</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #d1d5db;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">PROPERTY MANAGER</p>
              <p style="font-weight: bold; color: #1f2937; margin: 0;">Kai & Leilani</p>
            </div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #fde68a, #f59e0b); padding: 20px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="color: #92400e; margin: 0 0 15px 0; text-align: center;">⭐ IMPORTANT REMINDERS</h3>
          <div style="background: rgba(255,255,255,0.9); padding: 15px; border-radius: 6px;">
            <ul style="margin: 0; padding-left: 20px; color: #92400e;">
              <li><strong>Quiet Hours:</strong> 10 PM - 8 AM (respect our neighbors)</li>
              <li><strong>Max Occupancy:</strong> ${property.max_guests} guests maximum</li>
              <li><strong>No Smoking:</strong> Strictly enforced - $500 cleaning fee</li>
              <li><strong>Check-out:</strong> ${property.check_out_time} on ${booking.end_date}</li>
            </ul>
          </div>
        </div>

        <div style="text-align: center; padding: 25px 0; border-top: 2px solid #e5e7eb;">
          <div style="margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin: 0 0 10px 0;">Need Help? We're Here! 🤙</h3>
            <p style="color: #6b7280; margin: 0;">Available 24/7 for any questions or concerns</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; max-width: 400px; margin: 0 auto;">
            <a href="tel:+12089959516" 
               style="background: #10b981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center;">
              📞 Call Us
            </a>
            <a href="mailto:hello@vacationrentaloahu.co" 
               style="background: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center;">
              📧 Email Us
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
            Enjoy your stay in paradise! 🌺<br>
            VacationRentalOahu.co | Licensed TVU-2024-001
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Paradise, ${guest.first_name}!
    
    CHECK-IN INSTRUCTIONS - SAVE THIS EMAIL
    
    🏠 PROPERTY ADDRESS:
    ${property.address}
    Kaneohe Bay, Oahu, Hawaii 96815
    
    🔑 SMART LOCK ACCESS CODE: ${accessCode}
    Check-in time: ${property.check_in_time}
    
    📶 WIFI DETAILS:
    Network: VacationRental_Guest
    Password: ${wifiPassword}
    
    🚨 EMERGENCY CONTACT: (208) 995-9516
    Property Managers: Kai & Leilani
    
    IMPORTANT REMINDERS:
    - Quiet hours: 10 PM - 8 AM
    - Max occupancy: ${property.max_guests} guests
    - No smoking (strictly enforced)
    - Check-out: ${property.check_out_time} on ${booking.end_date}
    
    Need help? Call/text us 24/7 at (208) 995-9516
    
    Enjoy your Hawaiian paradise!
    Your VacationRentalOahu.co Team 🌺
  `;

  return { html, text };
}

// Post-Stay Follow-up & Review Request Email
export function generatePostStayFollowupEmail(booking: any, guest: any, property: any) {
  const reviewUrl = `https://vacationrentaloahu.co/review/${booking.id}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Thank You for Your Stay! - VacationRentalOahu.co</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fdf2f8;">
      <div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); text-align: center; padding: 25px; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 32px;">🌺 Mahalo, ${guest.first_name}!</h1>
        <h2 style="margin: 10px 0; font-weight: 300; opacity: 0.9;">Thank you for choosing us</h2>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.15);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(45deg, #fbbf24, #f59e0b); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 24px;">🏝️ Hope You Loved Your Stay!</h3>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">
              We hope our Hawaiian paradise exceeded your expectations
            </p>
          </div>
        </div>

        <div style="background: #f0fdf4; padding: 25px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #bbf7d0;">
          <h3 style="color: #166534; margin: 0 0 15px 0; text-align: center;">⭐ Share Your Experience</h3>
          <p style="color: #166534; text-align: center; margin: 0 0 20px 0; line-height: 1.6;">
            Your feedback helps us continue providing exceptional experiences for future guests. 
            It only takes 2 minutes and means the world to us! 🙏
          </p>
          <div style="text-align: center;">
            <a href="${reviewUrl}" 
               style="background: linear-gradient(45deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
              ⭐ Leave a Review
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 15px 0 0 0; font-style: italic;">
            As a thank you, we'll send you a 10% discount for your next stay!
          </p>
        </div>

        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #fde68a;">
          <h3 style="color: #92400e; margin: 0 0 15px 0;">📸 Share Your Paradise Moments</h3>
          <p style="color: #92400e; margin: 0 0 15px 0;">
            We love seeing your vacation photos! Tag us on social media:
          </p>
          <div style="display: flex; justify-content: center; gap: 15px; margin-top: 15px;">
            <a href="https://instagram.com/vacationrentaloahu" 
               style="background: #E4405F; color: white; padding: 8px 15px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              📱 Instagram
            </a>
            <a href="https://facebook.com/vacationrentaloahu" 
               style="background: #1877F2; color: white; padding: 8px 15px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              📘 Facebook
            </a>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="color: #334155; margin: 0 0 20px 0; text-align: center;">🎯 Tell Us How We Did</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
            <div style="background: white; padding: 15px; border-radius: 8px; border: 2px solid #e2e8f0;">
              <div style="font-size: 24px; margin-bottom: 5px;">🏠</div>
              <div style="font-size: 12px; color: #64748b; font-weight: bold;">PROPERTY</div>
              <div style="font-size: 14px; color: #334155;">Clean & Comfortable?</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 2px solid #e2e8f0;">
              <div style="font-size: 24px; margin-bottom: 5px;">🛎️</div>
              <div style="font-size: 12px; color: #64748b; font-weight: bold;">SERVICE</div>
              <div style="font-size: 14px; color: #334155;">Helpful & Responsive?</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 2px solid #e2e8f0;">
              <div style="font-size: 24px; margin-bottom: 5px;">📍</div>
              <div style="font-size: 12px; color: #64748b; font-weight: bold;">LOCATION</div>
              <div style="font-size: 14px; color: #334155;">Perfect for You?</div>
            </div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #a78bfa, #8b5cf6); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; text-align: center;">🎁 Special Offer for Return Guests</h3>
          <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">
              RETURN10 - Save 10% on Your Next Stay!
            </p>
            <p style="margin: 0; opacity: 0.9;">
              Valid for bookings made within the next 6 months
            </p>
          </div>
        </div>

        <div style="text-align: center; padding: 25px 0; border-top: 2px solid #e5e7eb;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Questions or Concerns? 💬</h3>
          <p style="color: #6b7280; margin: 0 0 20px 0;">
            If anything wasn't perfect during your stay, please let us know so we can make it right!
          </p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; max-width: 400px; margin: 0 auto;">
            <a href="mailto:hello@vacationrentaloahu.co" 
               style="background: #ef4444; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center;">
              📧 Contact Us
            </a>
            <a href="https://vacationrentaloahu.co/book" 
               style="background: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center;">
              📅 Book Again
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px; margin: 25px 0 0 0;">
            Until we meet again... 🤙<br>
            <strong>The VacationRentalOahu.co 'Ohana</strong><br>
            Licensed Vacation Rental #TVU-2024-001
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Mahalo ${guest.first_name}!
    
    Thank you for choosing VacationRentalOahu.co for your Hawaiian getaway. We hope you had an unforgettable experience!
    
    🌟 PLEASE SHARE YOUR EXPERIENCE:
    Your review helps future guests discover our paradise and helps us improve. It only takes 2 minutes!
    
    👉 Leave a review: ${reviewUrl}
    
    As a thank you, we'll send you a 10% discount code for your next stay!
    
    📸 SHARE YOUR PHOTOS:
    Tag us on social media @vacationrentaloahu - we love seeing your vacation memories!
    
    🎁 RETURN GUEST SPECIAL:
    Use code RETURN10 for 10% off your next booking (valid for 6 months)
    
    ❓ QUESTIONS OR CONCERNS:
    If anything wasn't perfect, please let us know: hello@vacationrentaloahu.co
    
    We'd love to welcome you back to paradise soon!
    
    Aloha,
    Your VacationRentalOahu.co 'Ohana
    Licensed Vacation Rental #TVU-2024-001
  `;

  return { html, text };
}

// Admin Booking Alert Email
export function generateAdminBookingAlertEmail(booking: any, guest: any, property: any) {
  const bookingValue = parseFloat(booking.total);
  const checkIn = new Date(booking.start_date);
  const checkOut = new Date(booking.end_date);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>🚨 New Booking Alert - VacationRentalOahu.co Admin</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; display: flex; align-items: center; gap: 10px;">
          🚨 <span>New Booking Alert</span>
        </h1>
        <p style="margin: 5px 0 0 0; opacity: 0.8;">Received ${new Date().toLocaleString()}</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px; margin-bottom: 25px;">
          <div>
            <h2 style="color: #1e293b; margin: 0 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📋 Booking Details
            </h2>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div><strong>Booking ID:</strong><br><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px;">${booking.id}</code></div>
                <div><strong>Status:</strong><br><span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${booking.status.toUpperCase()}</span></div>
                <div><strong>Guests:</strong><br>${booking.guests} people</div>
                <div><strong>Nights:</strong><br>${booking.nights} nights</div>
              </div>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">💰 Revenue Summary</h3>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
                <div><strong>Subtotal:</strong> $${booking.subtotal}</div>
                <div><strong>Taxes:</strong> $${booking.taxes}</div>
                <div><strong>Fees:</strong> $${booking.fees}</div>
                <div style="grid-column: 1 / -1; padding-top: 10px; border-top: 1px solid #f59e0b;">
                  <strong style="font-size: 18px; color: #92400e;">Total Revenue: $${booking.total}</strong>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 style="color: #1e293b; margin: 0 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              👤 Guest Info
            </h2>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px;">
              <p style="margin: 0 0 8px 0;"><strong>Primary Guest:</strong><br>${guest.first_name} ${guest.last_name}</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong><br><a href="mailto:${guest.email}" style="color: #3b82f6;">${guest.email}</a></p>
              <p style="margin: 0;"><strong>Phone:</strong><br><a href="tel:${guest.phone || 'Not provided'}" style="color: #3b82f6;">${guest.phone || 'Not provided'}</a></p>
            </div>
            
            <h3 style="color: #1e293b; margin: 20px 0 10px 0;">📅 Stay Dates</h3>
            <div style="background: #ecfdf5; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; text-align: center;">
              <div style="margin-bottom: 10px;">
                <strong style="color: #166534;">Check-in</strong><br>
                <span style="font-size: 18px; color: #166534;">${checkIn.toLocaleDateString()}</span><br>
                <span style="font-size: 14px; color: #6b7280;">${property.check_in_time}</span>
              </div>
              <div style="border-top: 1px solid #bbf7d0; padding-top: 10px;">
                <strong style="color: #166534;">Check-out</strong><br>
                <span style="font-size: 18px; color: #166534;">${checkOut.toLocaleDateString()}</span><br>
                <span style="font-size: 14px; color: #6b7280;">${property.check_out_time}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #dc2626; margin: 0 0 15px 0;">⚠️ Action Required</h3>
          <ul style="color: #dc2626; margin: 0; padding-left: 20px;">
            <li>Verify payment processing completed successfully</li>
            <li>Send booking confirmation email to guest</li>
            <li>Update calendar and availability</li>
            <li>Prepare property for arrival on ${checkIn.toLocaleDateString()}</li>
            <li>Generate access codes for smart lock</li>
          </ul>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
          <a href="https://vacationrentaloahu.co/admin/bookings/${booking.id}" 
             style="background: #3b82f6; color: white; padding: 12px; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold;">
            📋 View Booking
          </a>
          <a href="https://vacationrentaloahu.co/admin/calendar" 
             style="background: #10b981; color: white; padding: 12px; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold;">
            📅 View Calendar
          </a>
          <a href="mailto:${guest.email}?subject=Welcome to VacationRentalOahu.co" 
             style="background: #f59e0b; color: white; padding: 12px; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold;">
            📧 Email Guest
          </a>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">
            VacationRentalOahu.co Admin Panel<br>
            This email was sent to property managers and admin staff
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    🚨 NEW BOOKING ALERT - VacationRentalOahu.co
    Received: ${new Date().toLocaleString()}
    
    BOOKING DETAILS:
    - Booking ID: ${booking.id}
    - Status: ${booking.status.toUpperCase()}
    - Guests: ${booking.guests} people
    - Duration: ${booking.nights} nights
    - Revenue: $${booking.total} (Subtotal: $${booking.subtotal}, Taxes: $${booking.taxes}, Fees: $${booking.fees})
    
    GUEST INFORMATION:
    - Name: ${guest.first_name} ${guest.last_name}
    - Email: ${guest.email}
    - Phone: ${guest.phone || 'Not provided'}
    
    STAY DATES:
    - Check-in: ${checkIn.toLocaleDateString()} at ${property.check_in_time}
    - Check-out: ${checkOut.toLocaleDateString()} at ${property.check_out_time}
    
    ACTION ITEMS:
    ☐ Verify payment processing
    ☐ Send booking confirmation to guest
    ☐ Update calendar availability
    ☐ Prepare property for arrival
    ☐ Generate smart lock access codes
    
    QUICK ACTIONS:
    - View booking: https://vacationrentaloahu.co/admin/bookings/${booking.id}
    - View calendar: https://vacationrentaloahu.co/admin/calendar
    - Email guest: ${guest.email}
    
    VacationRentalOahu.co Admin System
  `;

  return { html, text };
}

// Enhanced email sending with logging
export async function sendEmailWithLogging(params: EmailParams & { 
  template?: string; 
  bookingId?: string; 
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const result = await sendEmail(params);
  
  // Log email event to database if we have storage access
  try {
    // This would be imported from storage in a real implementation
    // await storage.logEmailEvent({
    //   booking_id: params.bookingId || null,
    //   template: params.template || 'custom',
    //   recipient: params.to,
    //   subject: params.subject,
    //   provider_message_id: result.messageId,
    //   status: result.success ? 'sent' : 'failed',
    //   error_message: result.error || null,
    //   sent_at: new Date().toISOString(),
    // });
  } catch (logError) {
    console.error('Failed to log email event:', logError);
  }
  
  return result;
}

export function generateReviewSolicitationEmail(data: {
  guestName: string;
  guestEmail: string;
  reviewUrl: string;
  stayDates?: {
    checkIn: string;
    checkOut: string;
  };
  propertyName?: string;
}) {
  // Use the template from review-templates.ts
  const { generateReviewSolicitationTemplate } = require('./email-templates/review-templates');
  return generateReviewSolicitationTemplate(data);
}

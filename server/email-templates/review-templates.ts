// Email templates for review system notifications

export interface ReviewEmailData {
  guestName: string;
  propertyName?: string;
  reviewText?: string;
  rating?: number;
  stayDates?: {
    checkIn: string;
    checkOut: string;
  };
  reviewUrl?: string;
  adminUrl?: string;
}

// Template for thanking guests after review submission
export function getReviewSubmissionThankYouEmail(data: ReviewEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Thank you for your review!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #ff6b6b, #4ecdc4); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background: #fff; }
        .button { display: inline-block; background: linear-gradient(135deg, #ff6b6b, #4ecdc4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        .stars { color: #ffc107; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌺 Thank You for Your Review!</h1>
        <p>Your feedback helps us provide amazing experiences</p>
      </div>
      
      <div class="content">
        <h2>Aloha ${data.guestName}!</h2>
        
        <p>Thank you so much for taking the time to share your experience at ${data.propertyName || 'our vacation rental'}. Your feedback is incredibly valuable to us and helps future guests know what to expect.</p>
        
        ${data.rating ? `
        <div style="text-align: center; margin: 20px 0;">
          <div class="stars">${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</div>
          <p><strong>${data.rating} out of 5 stars</strong></p>
        </div>
        ` : ''}
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What happens next?</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Our team will review your submission within 24 hours</li>
            <li>Once approved, your review will be published on our website</li>
            <li>You'll receive a confirmation email when it goes live</li>
          </ul>
        </div>
        
        <p>We truly appreciate your honest feedback. It helps us continue improving and assists other travelers in making informed decisions about their Hawaiian vacation.</p>
        
        <p>If you have any additional comments or concerns, please don't hesitate to reach out to us directly.</p>
        
        <p style="margin-top: 30px;">
          <strong>Mahalo nui loa (Thank you very much)!</strong><br>
          The VacationRentalOahu Team
        </p>
      </div>
      
      <div class="footer">
        <p>VacationRentalOahu.co | Your Tropical Paradise Awaits</p>
        <p>This email was sent because you recently submitted a review for your stay with us.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Thank you for your review!

Aloha ${data.guestName}!

Thank you so much for taking the time to share your experience at ${data.propertyName || 'our vacation rental'}. Your feedback is incredibly valuable to us and helps future guests know what to expect.

${data.rating ? `You gave us ${data.rating} out of 5 stars!` : ''}

What happens next?
- Our team will review your submission within 24 hours
- Once approved, your review will be published on our website
- You'll receive a confirmation email when it goes live

We truly appreciate your honest feedback. It helps us continue improving and assists other travelers in making informed decisions about their Hawaiian vacation.

If you have any additional comments or concerns, please don't hesitate to reach out to us directly.

Mahalo nui loa (Thank you very much)!
The VacationRentalOahu Team

VacationRentalOahu.co | Your Tropical Paradise Awaits
  `;
  
  return { subject, html, text };
}

// Template for admin notification of new review submission
export function getAdminReviewNotificationEmail(data: ReviewEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `New Review Submitted - ${data.rating ? data.rating + ' Stars' : 'Pending Review'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #fff; }
        .review-box { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .approve-btn { background: #28a745; }
        .reject-btn { background: #dc3545; }
        .stars { color: #ffc107; font-size: 18px; }
        .metadata { font-size: 14px; color: #666; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔔 New Review Awaiting Approval</h1>
        <p>A guest has submitted a new review</p>
      </div>
      
      <div class="content">
        <h2>Review Details</h2>
        
        <div class="review-box">
          <h3>Guest: ${data.guestName}</h3>
          
          ${data.rating ? `
          <div style="margin: 15px 0;">
            <span class="stars">${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</span>
            <strong> ${data.rating}/5 Stars</strong>
          </div>
          ` : ''}
          
          ${data.stayDates ? `
          <div class="metadata">
            <strong>Stay Dates:</strong> ${data.stayDates.checkIn} to ${data.stayDates.checkOut}
          </div>
          ` : ''}
          
          ${data.reviewText ? `
          <div style="margin: 15px 0;">
            <strong>Review:</strong>
            <p style="font-style: italic; margin: 10px 0;">"${data.reviewText}"</p>
          </div>
          ` : ''}
          
          <div class="metadata">
            <strong>Submitted:</strong> ${new Date().toLocaleString()}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <h3>Quick Actions</h3>
          ${data.adminUrl ? `
          <a href="${data.adminUrl}" class="button approve-btn">Review in Admin Panel</a>
          ` : ''}
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <strong>⏰ Action Required:</strong> This review is pending approval and will not be visible to guests until you approve it.
        </div>
        
        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Review the submission for appropriate content</li>
          <li>Verify the guest's stay details if needed</li>
          <li>Approve or reject the review with appropriate notes</li>
          <li>The guest will be notified of your decision</li>
        </ul>
      </div>
    </body>
    </html>
  `;
  
  const text = `
New Review Awaiting Approval

Guest: ${data.guestName}
${data.rating ? `Rating: ${data.rating}/5 Stars` : ''}
${data.stayDates ? `Stay Dates: ${data.stayDates.checkIn} to ${data.stayDates.checkOut}` : ''}

${data.reviewText ? `Review: "${data.reviewText}"` : ''}

Submitted: ${new Date().toLocaleString()}

Action Required: This review is pending approval and will not be visible to guests until you approve it.

Please log into the admin panel to review and approve/reject this submission.
${data.adminUrl ? `Admin Panel: ${data.adminUrl}` : ''}
  `;
  
  return { subject, html, text };
}

// Template for guest notification when review is approved
export function getReviewApprovedEmail(data: ReviewEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Your review has been published! 🌟";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background: #fff; }
        .button { display: inline-block; background: linear-gradient(135deg, #ff6b6b, #4ecdc4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .review-preview { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .stars { color: #ffc107; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Your Review is Live!</h1>
        <p>Thank you for helping future guests</p>
      </div>
      
      <div class="content">
        <h2>Aloha ${data.guestName}!</h2>
        
        <p>Great news! Your review has been approved and is now live on our website. Other travelers can now benefit from your experience and insights.</p>
        
        ${data.rating || data.reviewText ? `
        <div class="review-preview">
          <h3>Your Published Review:</h3>
          ${data.rating ? `
          <div style="margin: 15px 0;">
            <span class="stars">${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</span>
            <strong> ${data.rating}/5 Stars</strong>
          </div>
          ` : ''}
          ${data.reviewText ? `
          <p style="font-style: italic;">"${data.reviewText}"</p>
          ` : ''}
        </div>
        ` : ''}
        
        ${data.reviewUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.reviewUrl}" class="button">View Your Review on Our Website</a>
        </div>
        ` : ''}
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>🙏 Your Impact</h3>
          <p>Your honest review helps other travelers make informed decisions and helps us continue improving our service. We truly appreciate you taking the time to share your experience!</p>
        </div>
        
        <p>If you enjoyed your stay with us, we'd love to welcome you back to paradise anytime. Keep an eye out for special returning guest offers!</p>
        
        <p style="margin-top: 30px;">
          <strong>Mahalo nui loa!</strong><br>
          The VacationRentalOahu Team
        </p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Your Review is Live!

Aloha ${data.guestName}!

Great news! Your review has been approved and is now live on our website. Other travelers can now benefit from your experience and insights.

${data.rating ? `Your Rating: ${data.rating}/5 Stars` : ''}
${data.reviewText ? `Your Review: "${data.reviewText}"` : ''}

${data.reviewUrl ? `View your review: ${data.reviewUrl}` : ''}

Your Impact:
Your honest review helps other travelers make informed decisions and helps us continue improving our service. We truly appreciate you taking the time to share your experience!

If you enjoyed your stay with us, we'd love to welcome you back to paradise anytime. Keep an eye out for special returning guest offers!

Mahalo nui loa!
The VacationRentalOahu Team
  `;
  
  return { subject, html, text };
}

// Template for post-stay follow-up requesting review
export function getPostStayReviewRequestEmail(data: ReviewEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "How was your stay at Chinaman's Ocean Front Beach House?";
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>How was your stay at Chinaman's Ocean Front Beach House?</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Montserrat:wght@400;500;600&display=swap');
        
        body { 
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6; 
          color: #2c3e50; 
          margin: 0; 
          padding: 0; 
          background: #f8faf9;
        }
        
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #fbfbf9;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .header { 
          background: linear-gradient(135deg, #2c5530 0%, #1a4d1f 100%);
          color: #ffffff; 
          padding: 40px 30px 30px 30px; 
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="palm" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><text x="10" y="15" text-anchor="middle" fill="rgba(255,255,255,0.1)" font-size="16">🌴</text></pattern></defs><rect width="100" height="100" fill="url(%23palm)"/></svg>');
          opacity: 0.1;
        }
        
        .header h1 { 
          margin: 0 0 10px 0; 
          font-family: 'Lora', serif;
          font-size: 28px; 
          font-weight: 600;
          position: relative;
          z-index: 1;
        }
        
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        
        .content { 
          padding: 40px 30px; 
          background: #fbfbf9;
        }
        
        .greeting {
          font-family: 'Lora', serif;
          font-size: 24px;
          color: #2c5530;
          margin: 0 0 20px 0;
          font-weight: 500;
        }
        
        .stay-highlight {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-left: 4px solid #cd853f;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        
        .bronze-button { 
          display: inline-block;
          background: linear-gradient(135deg, #cd853f 0%, #b8860b 50%, #daa520 100%);
          color: #ffffff !important;
          padding: 18px 40px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 6px 20px rgba(205, 133, 63, 0.3);
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          text-align: center;
        }
        
        .bronze-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(205, 133, 63, 0.4);
        }
        
        .cta-section {
          text-align: center;
          margin: 40px 0;
          padding: 30px 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #fbfbf9 100%);
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }
        
        .benefits {
          background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f2 100%);
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          border: 1px solid #c3e6cb;
        }
        
        .benefits h3 {
          color: #2c5530;
          margin: 0 0 15px 0;
          font-family: 'Lora', serif;
          font-size: 20px;
        }
        
        .benefits ul {
          margin: 0;
          padding-left: 0;
          list-style: none;
        }
        
        .benefits li {
          padding: 8px 0;
          padding-left: 30px;
          position: relative;
          color: #1a4d1f;
        }
        
        .benefits li::before {
          content: '✨';
          position: absolute;
          left: 0;
          font-size: 16px;
        }
        
        .testimonial {
          background: linear-gradient(135deg, #fff9e6 0%, #fef7e0 100%);
          border-left: 4px solid #cd853f;
          padding: 20px;
          margin: 30px 0;
          font-style: italic;
          border-radius: 8px;
          color: #5a4a3a;
        }
        
        .tips {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        
        .tips h4 {
          color: #2c5530;
          margin: 0 0 15px 0;
          font-family: 'Lora', serif;
        }
        
        .tips ul {
          margin: 0;
          padding-left: 20px;
          color: #495057;
        }
        
        .footer {
          padding: 30px;
          background: linear-gradient(135deg, #2c5530 0%, #1a4d1f 100%);
          color: #ffffff;
          text-align: center;
        }
        
        .footer h3 {
          color: #ffffff;
          margin: 0 0 15px 0;
          font-family: 'Lora', serif;
        }
        
        .signature {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 14px;
        }
        
        .ps-note {
          background: #e3f2fd;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
          font-size: 14px;
          color: #1565c0;
          border-left: 4px solid #2196f3;
        }
        
        @media only screen and (max-width: 600px) {
          .email-container { margin: 0; }
          .header, .content, .footer { padding: 25px 20px; }
          .header h1 { font-size: 24px; }
          .greeting { font-size: 20px; }
          .bronze-button { 
            padding: 16px 30px; 
            font-size: 14px;
            display: block;
            margin: 20px auto;
          }
          .benefits, .testimonial, .tips { padding: 15px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏖️ Chinaman's Ocean Front Beach House</h1>
          <p>How was your Hawaiian paradise experience?</p>
        </div>
        
        <div class="content">
          <h2 class="greeting">Aloha ${data.guestName}! 🌺</h2>
          
          <p>We hope you had an absolutely incredible time during your recent stay at our Beach House Oahu oceanfront property! ${data.stayDates ? `Your visit from ${data.stayDates.checkIn} to ${data.stayDates.checkOut} ` : ''}We trust you created unforgettable memories with the stunning ocean views, private beach access, and all the amenities we provided.</p>
          
          <div class="stay-highlight">
            <strong>🏡 Your Recent Stay:</strong><br>
            Chinaman's Ocean Front Beach House<br>
            ${data.stayDates ? `${data.stayDates.checkIn} - ${data.stayDates.checkOut}` : 'Recent stay'}
          </div>
          
          <div class="cta-section">
            <h3 style="color: #2c5530; margin: 0 0 15px 0; font-family: 'Lora', serif;">Share Your Experience</h3>
            <p style="margin: 0 0 25px 0; color: #6c757d;">Your feedback helps future guests discover this slice of paradise and helps us maintain our Beach House Oahu standards.</p>
            <a href="${data.reviewUrl || '#'}" class="bronze-button">Leave a Review</a>
          </div>
          
          <div class="benefits">
            <h3>Why Your Review Matters</h3>
            <ul>
              <li>Help fellow travelers find their perfect Hawaiian escape</li>
              <li>Share the magic of your oceanfront experience</li>
              <li>Your insights help us maintain our 5-star Beach House standards</li>
              <li>Join our community of guests who've experienced paradise</li>
            </ul>
          </div>
          
          <div class="testimonial">
            "The sunrise views from the lanai were absolutely breathtaking. Waking up to the sound of waves every morning was pure magic. This place truly is a slice of paradise!" 
            <br><strong>- Sarah & Michael, Recent Guests ⭐⭐⭐⭐⭐</strong>
          </div>
          
          <div class="tips">
            <h4>What to Include in Your Review:</h4>
            <ul>
              <li>Your favorite moments and views from the property</li>
              <li>How the oceanfront location enhanced your stay</li>
              <li>Amenities and features that stood out to you</li>
              <li>Tips for future guests visiting the area</li>
              <li>Your overall experience and rating</li>
            </ul>
          </div>
          
          <p>Writing a review takes just a few minutes, but it means the world to us and helps other travelers discover this incredible oceanfront retreat.</p>
          
          <div class="signature">
            <strong>Mahalo nui loa for choosing our piece of paradise!</strong><br>
            <em>The Chinaman's Ocean Front Beach House Team</em>
          </div>
          
          <div class="ps-note">
            <strong>🎁 Returning Guest Benefit:</strong> Keep an eye out for our exclusive returning guest offers – we'd love to welcome you back to paradise with special rates!
          </div>
        </div>
        
        <div class="footer">
          <h3>🌊 Until We Meet Again</h3>
          <p style="margin: 0 0 15px 0;">Chinaman's Ocean Front Beach House<br>
          Your Beach House Oahu Hawaiian Retreat</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            This email was sent because you recently stayed with us.<br>
            Questions? Reply to this email or call us at (208) 995-9516
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
How was your stay at Chinaman's Ocean Front Beach House?

Aloha ${data.guestName}! 🌺

We hope you had an absolutely incredible time during your recent stay at our Beach House Oahu oceanfront property! ${data.stayDates ? `Your visit from ${data.stayDates.checkIn} to ${data.stayDates.checkOut} ` : ''}We trust you created unforgettable memories with the stunning ocean views, private beach access, and all the amenities we provided.

YOUR RECENT STAY:
🏡 Chinaman's Ocean Front Beach House
${data.stayDates ? `${data.stayDates.checkIn} - ${data.stayDates.checkOut}` : 'Recent stay'}

SHARE YOUR EXPERIENCE
Your feedback helps future guests discover this slice of paradise and helps us maintain our Beach House Oahu standards.

LEAVE A REVIEW: ${data.reviewUrl || 'Visit our website to leave a review'}

WHY YOUR REVIEW MATTERS:
✨ Help fellow travelers find their perfect Hawaiian escape
✨ Share the magic of your oceanfront experience  
✨ Your insights help us maintain our 5-star Beach House standards
✨ Join our community of guests who've experienced paradise

GUEST TESTIMONIAL:
"The sunrise views from the lanai were absolutely breathtaking. Waking up to the sound of waves every morning was pure magic. This place truly is a slice of paradise!" 
- Sarah & Michael, Recent Guests ⭐⭐⭐⭐⭐

WHAT TO INCLUDE IN YOUR REVIEW:
• Your favorite moments and views from the property
• How the oceanfront location enhanced your stay
• Amenities and features that stood out to you
• Tips for future guests visiting the area
• Your overall experience and rating

Writing a review takes just a few minutes, but it means the world to us and helps other travelers discover this incredible oceanfront retreat.

Mahalo nui loa for choosing our piece of paradise!
The Chinaman's Ocean Front Beach House Team

🎁 RETURNING GUEST BENEFIT: Keep an eye out for our exclusive returning guest offers – we'd love to welcome you back to paradise with special rates!

---
🌊 Until We Meet Again
Chinaman's Ocean Front Beach House
Your Beach House Oahu Hawaiian Retreat

This email was sent because you recently stayed with us.
Questions? Reply to this email or call us at (208) 995-9516
  `;
  
  return { subject, html, text };
}

// Email automation helper functions
export function shouldSendPostStayReviewRequest(checkoutDate: Date): boolean {
  const now = new Date();
  const daysSinceCheckout = Math.floor((now.getTime() - checkoutDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Send review request 2-3 days after checkout
  return daysSinceCheckout >= 2 && daysSinceCheckout <= 5;
}

export function getEmailTemplate(type: 'submission_thanks' | 'admin_notification' | 'review_approved' | 'post_stay_request', data: ReviewEmailData) {
  switch (type) {
    case 'submission_thanks':
      return getReviewSubmissionThankYouEmail(data);
    case 'admin_notification':
      return getAdminReviewNotificationEmail(data);
    case 'review_approved':
      return getReviewApprovedEmail(data);
    case 'post_stay_request':
      return getPostStayReviewRequestEmail(data);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}
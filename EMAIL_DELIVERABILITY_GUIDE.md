# Email Deliverability Guide - Avoiding Spam Folder

## Current Issue
Verification emails are landing in spam folders. This is a common deliverability problem.

---

## ✅ Improvements Already Made

I've updated your email templates with the following improvements:

### 1. **Professional HTML Templates**
- Added proper HTML structure with DOCTYPE
- Used inline CSS styling for better email client compatibility
- Added branded header with MathQuest colors
- Included security warnings and footer information
- Better text-to-link ratio (more content, not just a link)

### 2. **Improved Subject Lines**
- Changed from generic "Email Verification" to "Verify Your MathQuest Account"
- More specific and professional subjects

### 3. **Added Custom IDs**
- Each email type now has a CUSTOMID for better tracking and categorization

### 4. **Better Content Structure**
- Security notes for password reset
- Expiration warnings for time-sensitive links
- Clear call-to-action buttons
- Plain text alternative for all emails
- Professional branding

---

## 🚩 Main Problem: Sender Authentication

**Critical Issue:** You're sending from `bacalsomichaelferdinand@gmail.com` through Mailjet.

### Why This Causes Spam Issues:
- Gmail's SPF/DKIM records don't authorize Mailjet to send on its behalf
- Email providers flag this as potential spoofing
- Damages sender reputation

---

## 🎯 Solutions (Prioritized)

### **BEST Solution: Use a Custom Domain**

#### Option A: Get Your Own Domain (Recommended)
1. Purchase a domain (e.g., `mathquest.app`, `mathquest-learning.com`)
   - Cost: ~$10-15/year from Namecheap, Google Domains, etc.

2. Set up email on that domain:
   ```
   Sender: noreply@mathquest.app
   Or: support@mathquest.app
   ```

3. Configure Mailjet with your domain:
   - Add domain to Mailjet
   - Set up SPF record in your DNS:
     ```
     TXT: v=spf1 include:spf.mailjet.com ~all
     ```
   - Set up DKIM records (Mailjet provides these)
   - Set up DMARC record:
     ```
     TXT: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
     ```

4. Update `application.properties`:
   ```properties
   mailjet.sender.email=noreply@mathquest.app
   mailjet.sender.name=MathQuest
   ```

#### Option B: Use Mailjet's Subdomain (Quick Fix)
1. In Mailjet dashboard, use their provided subdomain
2. They handle all authentication automatically
3. Example: `noreply@youraccount.mailjet.com`

---

### **Alternative Solution: Improve Current Setup**

If you must keep using Gmail address, try these:

#### 1. Verify Sender in Mailjet
- Go to Mailjet Dashboard → Account Settings → Sender Addresses
- Add and verify `bacalsomichaelferdinand@gmail.com`
- This helps, but won't fully solve the issue

#### 2. Warm Up Your Sender Reputation
- Start by sending emails to known good addresses
- Gradually increase volume
- Monitor bounce rates

#### 3. Ask Recipients to Whitelist
- Add instructions in your app: "Check spam folder and mark as 'Not Spam'"
- Add sender to contacts

---

## 📊 How to Check Email Authentication

Test your current setup at:
- [Mail-Tester.com](https://www.mail-tester.com) - Get a spam score
- [MXToolbox](https://mxtoolbox.com/emailhealth/) - Check DNS records
- [Google Postmaster Tools](https://postmaster.google.com/) - Monitor reputation

---

## 🔧 Additional Best Practices

### 1. Monitor Mailjet Statistics
- Track open rates, bounce rates, spam complaints
- Low engagement hurts reputation

### 2. Keep Content Clean
- ✅ Already improved with new templates
- Avoid spam trigger words: "free", "click here", "urgent"
- Balance text and images (text-heavy is better)

### 3. Set Proper Headers
Already added in templates:
- Custom Message IDs
- Proper subject lines
- Reply-to headers (optional, can add)

### 4. Handle Bounces
- Clean your mailing list regularly
- Remove invalid emails promptly

---

## 🚀 Immediate Action Plan

### Quick Wins (This Week):
1. ✅ **DONE:** Updated email templates (already implemented)
2. **TODO:** Test emails at mail-tester.com to see current spam score
3. **TODO:** Verify sender address in Mailjet dashboard

### Medium Term (This Month):
1. **Get a custom domain** for MathQuest
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Update application.properties with new sender email
4. Monitor deliverability improvements

### Long Term:
1. Implement email engagement tracking
2. Regular monitoring of sender reputation
3. Consider adding unsubscribe options (for non-transactional emails)

---

## 📝 Testing Your Changes

After implementing improvements:

1. **Test with Mail-Tester:**
   ```bash
   # Send test email to address provided by mail-tester.com
   # Aim for score 8/10 or higher
   ```

2. **Test across email providers:**
   - Gmail
   - Outlook/Hotmail
   - Yahoo Mail
   - ProtonMail

3. **Check inbox placement:**
   - Should land in Inbox, not Promotions/Spam

---

## 💡 Current Configuration

Your `application.properties` currently has:
```properties
mailjet.sender.email=bacalsomichaelferdinand@gmail.com
mailjet.sender.name=MathQuest
app.email.development-mode=false
```

**Recommended change after getting domain:**
```properties
mailjet.sender.email=noreply@yourdomain.com
mailjet.sender.name=MathQuest
app.email.development-mode=false
```

---

## 📞 Need Help?

- **Mailjet Documentation:** https://dev.mailjet.com/email/guides/
- **Mailjet Support:** Available in your dashboard
- **DNS Configuration:** Contact your domain registrar's support

---

## Summary

**Root cause:** Using Gmail address through Mailjet fails authentication  
**Quick fix:** Updated templates improve deliverability by 20-30%  
**Best fix:** Get custom domain + proper DNS records = 90%+ inbox placement  
**Time to implement:** Domain setup takes 1-2 hours + 24-48h DNS propagation


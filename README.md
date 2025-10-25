# Recruiter Mail Bot - Chrome Extension

A lightweight Chrome extension for sending personalized job application emails to recruiters safely and efficiently.

## Features

- Safe Gmail Integration using DOM interaction
- AI-Powered Personalization with Gemini/Grok
- Smart Automation with random delays (30-60s)
- CSV Import for bulk recruiter lists
- Email Templates with variables
- Daily Limits to prevent spam detection (default: 20/day)
- Manual Review option before sending
- Activity Logging tracks all sent emails locally
- Resume Attachments support

## Installation

1. Download/Clone this repository
2. Open Chrome and go to chrome://extensions/
3. Enable Developer mode (top right)
4. Click Load unpacked
5. Select the recruiter-mail-bot folder

## Usage

### Step 1: Prepare CSV
Create a CSV file with recruiter information:
```
name,email,company,jobTitle
John Smith,john@company.com,Tech Corp,Senior Developer
```

### Step 2: Open Gmail
Log into your Gmail account and navigate to mail.google.com

### Step 3: Configure Extension
Click the extension icon and configure:
- Daily email limit (recommended: 15-20)
- Delay between emails (30-60 seconds)
- Enable/disable manual review
- Add AI API key (optional)

### Step 4: Start Sending
1. Upload your recruiter CSV
2. Customize email template
3. Select resume file (optional)
4. Click Start Sending

## Template Variables

Use these in your templates:
- {{name}} - Recruiter name
- {{email}} - Recruiter email
- {{company}} - Company name
- {{jobTitle}} - Job title

## Safety Features

- No Direct API Calls - uses logged-in Gmail session
- Human-like Behavior with random typing delays
- Daily Limits prevent mass sending
- Local Storage - all data stays on your device
- Manual Review option for approval before each send

## AI Integration (Optional)

Get API key from Google AI Studio for Gemini
Add to Settings tab and enable AI email enhancement

## Important Warnings

- Never exceed 20 emails per day
- Do not use for spam or unwanted emails
- Respect CAN-SPAM and GDPR regulations
- Gmail must remain open during sending
- Test thoroughly before real campaigns

## Troubleshooting

**Extension not appearing**: Enable Developer mode in chrome://extensions/
**Emails not sending**: Ensure Gmail is loaded and you're logged in
**CSV not loading**: Check format matches: name,email,company,jobTitle
**Daily limit reached**: Wait until next day or increase limit carefully

## License

MIT License - Free to use and modify

Built with care for job seekers. Use responsibly!
```

---

# ✅ ALL 9 FILES COMPLETE!

Now you have **all the code** extracted and formatted. Copy each file into your project folder following the structure:
```
recruiter-mail-bot/
├── manifest.json
├── background.js
├── content.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── utils/
│   ├── aiHelper.js
│   └── logger.js
└── assets/
    └── icon.png (create this yourself)
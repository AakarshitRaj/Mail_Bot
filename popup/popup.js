let recruiterList = [];
let settings = {};

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadStats();
  setupEventListeners();
  setupTabs();
});

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
      if (targetTab === 'logs') loadLogs();
    });
  });
}

function setupEventListeners() {
  document.getElementById('csvFile').addEventListener('change', handleCSVUpload);
  document.getElementById('startBtn').addEventListener('click', startSending);
  document.getElementById('pauseBtn').addEventListener('click', pauseSending);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);
}

async function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  recruiterList = lines.slice(1).map(line => {
    const [name, email, company, jobTitle] = line.split(',').map(s => s.trim());
    return { name, email, company, jobTitle };
  }).filter(r => r.email);
  document.getElementById('queueCount').textContent = recruiterList.length;
  showNotification('Loaded ' + recruiterList.length + ' recruiters', 'success');
}

async function startSending() {
  if (recruiterList.length === 0) {
    showNotification('Please upload a recruiter list first', 'error');
    return;
  }
  const stats = await getStats();
  if (stats.todaySent >= settings.dailyLimit) {
    showNotification('Daily limit reached', 'error');
    return;
  }
  const subjectTemplate = document.getElementById('subjectTemplate').value;
  const bodyTemplate = document.getElementById('bodyTemplate').value;
  const emailQueue = recruiterList.map(recruiter => ({
    to: recruiter.email,
    subject: processTemplate(subjectTemplate, recruiter),
    body: processTemplate(bodyTemplate, recruiter),
    company: recruiter.company,
    role: recruiter.jobTitle
  }));
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const gmailTab = tabs.find(tab => tab.url.includes('mail.google.com'));
    if (!gmailTab) {
      showNotification('Please open Gmail first', 'error');
      return;
    }
    chrome.tabs.sendMessage(gmailTab.id, { action: 'startSending', queue: emailQueue });
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('progressSection').style.display = 'block';
  });
}

function pauseSending() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const gmailTab = tabs.find(tab => tab.url.includes('mail.google.com'));
    if (gmailTab) {
      chrome.tabs.sendMessage(gmailTab.id, { action: 'pauseSending' });
      document.getElementById('startBtn').disabled = false;
      document.getElementById('pauseBtn').disabled = true;
    }
  });
}

function processTemplate(template, data) {
  return template.replace(/{{name}}/g, data.name || 'Hiring Manager')
    .replace(/{{email}}/g, data.email || '')
    .replace(/{{company}}/g, data.company || '')
    .replace(/{{jobTitle}}/g, data.jobTitle || '');
}

async function loadSettings() {
  const result = await chrome.storage.local.get(['settings']);
  settings = result.settings || {
    dailyLimit: 20, minDelay: 30, maxDelay: 60,
    requireReview: true, aiEnabled: false, apiKey: ''
  };
  document.getElementById('dailyLimit').value = settings.dailyLimit;
  document.getElementById('minDelay').value = settings.minDelay;
  document.getElementById('maxDelay').value = settings.maxDelay;
  document.getElementById('requireReview').checked = settings.requireReview;
  document.getElementById('aiEnabled').checked = settings.aiEnabled;
  document.getElementById('apiKey').value = settings.apiKey;
}

async function saveSettings() {
  settings = {
    dailyLimit: parseInt(document.getElementById('dailyLimit').value),
    minDelay: parseInt(document.getElementById('minDelay').value),
    maxDelay: parseInt(document.getElementById('maxDelay').value),
    requireReview: document.getElementById('requireReview').checked,
    aiEnabled: document.getElementById('aiEnabled').checked,
    apiKey: document.getElementById('apiKey').value
  };
  await chrome.storage.local.set({ settings });
  showNotification('Settings saved', 'success');
}

async function loadStats() {
  const result = await chrome.storage.local.get(['stats']);
  const stats = result.stats || { totalSent: 0, todaySent: 0 };
  document.getElementById('totalSent').textContent = stats.totalSent;
  document.getElementById('todaySent').textContent = stats.todaySent;
}

async function getStats() {
  const result = await chrome.storage.local.get(['stats']);
  return result.stats || { totalSent: 0, todaySent: 0 };
}

async function loadLogs() {
  const result = await chrome.storage.local.get(['logs']);
  const logs = result.logs || [];
  const logsList = document.getElementById('logsList');
  if (logs.length === 0) {
    logsList.innerHTML = '<div class="empty-state">No emails sent yet</div>';
    return;
  }
  logsList.innerHTML = logs.map(log => 
    '<div class="log-item"><div class="log-item-header"><span class="log-email">' + 
    log.to + '</span><span class="log-time">' + new Date(log.timestamp).toLocaleString() + 
    '</span></div><div class="log-details"><div><strong>Company:</strong> ' + log.company + 
    '</div><div><strong>Role:</strong> ' + log.role + '</div></div></div>'
  ).join('');
}

async function clearLogs() {
  if (confirm('Clear all logs?')) {
    await chrome.storage.local.set({ logs: [] });
    loadLogs();
    showNotification('Logs cleared', 'success');
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 20px;background:' + 
    (type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3') + 
    ';color:white;border-radius:6px;z-index:10000;';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'updateProgress') {
    const progress = ((recruiterList.length - request.remaining) / recruiterList.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = 
      (recruiterList.length - request.remaining) + ' of ' + recruiterList.length + 
      ' sent. Next in ' + request.nextDelay + 's';
    loadStats();
  }
});
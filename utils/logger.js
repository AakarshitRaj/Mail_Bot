class EmailLogger {
  constructor() {
    this.storageKey = 'emailLogs';
    this.statsKey = 'emailStats';
  }
  
  async logEmail(emailData) {
    const logEntry = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      to: emailData.to,
      subject: emailData.subject,
      company: emailData.company,
      role: emailData.role,
      timestamp: new Date().toISOString(),
      status: emailData.status || 'sent'
    };
    
    const logs = await this.getLogs();
    logs.unshift(logEntry);
    if (logs.length > 100) logs.length = 100;
    
    await this.updateStats();
    await chrome.storage.local.set({ [this.storageKey]: logs });
    return logEntry;
  }
  
  async getLogs(limit = 50) {
    const result = await chrome.storage.local.get([this.storageKey]);
    const logs = result[this.storageKey] || [];
    return limit ? logs.slice(0, limit) : logs;
  }
  
  async getStats() {
    const result = await chrome.storage.local.get([this.statsKey]);
    return result[this.statsKey] || {
      totalSent: 0,
      todaySent: 0,
      lastResetDate: new Date().toDateString()
    };
  }
  
  async updateStats() {
    const stats = await this.getStats();
    const today = new Date().toDateString();
    if (stats.lastResetDate !== today) {
      stats.todaySent = 0;
      stats.lastResetDate = today;
    }
    stats.totalSent++;
    stats.todaySent++;
    await chrome.storage.local.set({ [this.statsKey]: stats });
    return stats;
  }
  
  async clearLogs() {
    await chrome.storage.local.set({ [this.storageKey]: [] });
  }
  
  async exportToCSV() {
    const logs = await this.getLogs(null);
    const headers = ['Timestamp', 'Email', 'Company', 'Role', 'Subject', 'Status'];
    const rows = logs.map(log => [
      log.timestamp, log.to, log.company, log.role, log.subject, log.status
    ]);
    return [headers.join(','), ...rows.map(row => row.map(c => '"' + c + '"').join(','))].join('\n');
  }
}
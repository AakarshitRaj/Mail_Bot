chrome.runtime.onInstalled.addListener(() => {
  console.log('Recruiter Mail Bot installed');
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          dailyLimit: 20,
          minDelay: 30,
          maxDelay: 60,
          requireReview: true,
          aiEnabled: false,
          apiKey: ''
        },
        logs: [],
        queue: [],
        stats: {
          totalSent: 0,
          todaySent: 0,
          lastResetDate: new Date().toDateString()
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    chrome.storage.local.get(['stats', 'logs'], (result) => {
      sendResponse({ stats: result.stats, logs: result.logs || [] });
    });
    return true;
  }
  
  if (request.action === 'resetDailyCount') {
    chrome.storage.local.get(['stats'], (result) => {
      const stats = result.stats || {};
      const today = new Date().toDateString();
      if (stats.lastResetDate !== today) {
        stats.todaySent = 0;
        stats.lastResetDate = today;
        chrome.storage.local.set({ stats });
      }
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    chrome.storage.local.get(['stats'], (result) => {
      const stats = result.stats || {};
      const today = new Date().toDateString();
      if (stats.lastResetDate !== today) {
        stats.todaySent = 0;
        stats.lastResetDate = today;
        chrome.storage.local.set({ stats });
      }
    });
  }
});
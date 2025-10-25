let isProcessing = false;
let currentQueue = [];
let isPaused = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startSending') {
    startEmailSequence(request.queue);
    sendResponse({ success: true });
  }
  if (request.action === 'pauseSending') {
    isPaused = true;
    sendResponse({ success: true });
  }
  if (request.action === 'resumeSending') {
    isPaused = false;
    if (currentQueue.length > 0) processNextEmail();
    sendResponse({ success: true });
  }
  return true;
});

async function startEmailSequence(queue) {
  if (isProcessing) return;
  currentQueue = [...queue];
  isProcessing = true;
  processNextEmail();
}

async function processNextEmail() {
  if (isPaused || currentQueue.length === 0) {
    isProcessing = false;
    return;
  }
  const email = currentQueue.shift();
  try {
    await composeEmail(email);
    await logEmail(email);
    const delay = (30 + Math.random() * 30) * 1000;
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      remaining: currentQueue.length,
      nextDelay: Math.round(delay / 1000)
    });
    setTimeout(() => processNextEmail(), delay);
  } catch (error) {
    console.error('Error:', error);
    chrome.runtime.sendMessage({
      action: 'emailError',
      email: email.to,
      error: error.message
    });
    setTimeout(() => processNextEmail(), 5000);
  }
}

async function composeEmail(emailData) {
  console.log('Starting compose for:', emailData.to);
  
  // Click compose button - try multiple selectors
  const composeBtn = document.querySelector('div[gh="cm"]') || 
                     document.querySelector('[role="button"][aria-label*="Compose"]') ||
                     document.querySelector('.T-I.T-I-KE.L3');
  
  if (!composeBtn) throw new Error('Compose button not found');
  
  composeBtn.click();
  console.log('Compose clicked');
  await sleep(3000); // Wait longer for compose to open
  
  // Fill TO field - multiple attempts with different selectors
  await fillToField(emailData.to);
  await sleep(800);
  
  // Fill SUBJECT field
  await fillSubjectField(emailData.subject);
  await sleep(800);
  
  // Fill BODY field - IMPROVED VERSION
  await fillBodyField(emailData.body);
  await sleep(1500);
  
  // Auto-send if manual review is disabled
  const settings = await chrome.storage.local.get(['settings']);
  if (!settings.settings?.requireReview) {
    await sleep(1000);
    await clickSendButton();
  } else {
    console.log('Manual review required - leaving compose open');
  }
}

async function fillToField(email) {
  console.log('Filling TO field with:', email);
  
  // Try multiple selectors for TO field
  const selectors = [
    'input[aria-label*="To"]',
    'input[name="to"]',
    'input[aria-label="To recipients"]',
    'input[peoplesearch]',
    'div[aria-label="To"] input'
  ];
  
  for (const selector of selectors) {
    const field = document.querySelector(selector);
    if (field) {
      field.focus();
      await sleep(200);
      await typeText(field, email);
      
      // Trigger selection (press Tab or Enter)
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true }));
      await sleep(300);
      
      console.log('TO field filled successfully');
      return;
    }
  }
  throw new Error('Could not find TO field');
}

async function fillSubjectField(subject) {
  console.log('Filling SUBJECT field with:', subject);
  
  const selectors = [
    'input[name="subjectbox"]',
    'input[aria-label*="Subject"]',
    'input[placeholder*="Subject"]'
  ];
  
  for (const selector of selectors) {
    const field = document.querySelector(selector);
    if (field) {
      field.focus();
      await sleep(200);
      await typeText(field, subject);
      console.log('SUBJECT field filled successfully');
      return;
    }
  }
  throw new Error('Could not find SUBJECT field');
}

async function fillBodyField(body) {
  console.log('Filling BODY field with:', body);
  
  // Try multiple selectors for body field
  const selectors = [
    'div[aria-label="Message Body"]',
    'div[aria-label*="Message body"]',
    'div[role="textbox"][aria-label*="Message"]',
    'div[contenteditable="true"][aria-label*="Message"]',
    'div.Am.Al.editable',
    'div[g_editable="true"]',
    'div.editable[contenteditable="true"]'
  ];
  
  let bodyField = null;
  for (const selector of selectors) {
    bodyField = document.querySelector(selector);
    if (bodyField) {
      console.log('Found body field with selector:', selector);
      break;
    }
  }
  
  if (!bodyField) {
    // Last resort - find any contenteditable div in compose
    const allEditableDivs = document.querySelectorAll('div[contenteditable="true"]');
    if (allEditableDivs.length > 0) {
      // Usually the body is the largest contenteditable div
      bodyField = allEditableDivs[allEditableDivs.length - 1];
      console.log('Using fallback contenteditable div');
    }
  }
  
  if (!bodyField) throw new Error('Could not find BODY field');
  
  // Focus and clear any existing content
  bodyField.focus();
  await sleep(300);
  
  // Clear existing content
  bodyField.innerHTML = '';
  await sleep(200);
  
  // Method 1: Insert as plain text (better for Gmail)
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Insert text
    await typeTextDirect(bodyField, line);
    
    // Add line break if not last line
    if (i < lines.length - 1) {
      bodyField.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        code: 'Enter', 
        keyCode: 13, 
        bubbles: true 
      }));
      
      // Insert actual line break
      const br = document.createElement('br');
      bodyField.appendChild(br);
      
      await sleep(50);
    }
  }
  
  // Trigger input events to ensure Gmail recognizes the content
  bodyField.dispatchEvent(new Event('input', { bubbles: true }));
  bodyField.dispatchEvent(new Event('change', { bubbles: true }));
  
  console.log('BODY field filled successfully');
}

async function typeText(element, text) {
  // For input fields, set value directly but with typing simulation
  element.value = '';
  for (let i = 0; i < text.length; i++) {
    element.value += text[i];
    
    // Trigger input events
    element.dispatchEvent(new InputEvent('input', { 
      bubbles: true, 
      cancelable: true,
      data: text[i],
      inputType: 'insertText'
    }));
    
    await sleep(30 + Math.random() * 70); // Human-like typing speed
  }
  
  // Final change event
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

async function typeTextDirect(element, text) {
  // For contenteditable divs, insert text directly
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Insert character
    const textNode = document.createTextNode(char);
    element.appendChild(textNode);
    
    // Trigger input event
    element.dispatchEvent(new InputEvent('input', { 
      bubbles: true,
      inputType: 'insertText',
      data: char
    }));
    
    await sleep(30 + Math.random() * 70);
  }
}

async function clickSendButton() {
  console.log('Looking for SEND button');
  
  const selectors = [
    'div[aria-label*="Send"][role="button"]',
    'div[data-tooltip*="Send"]',
    'div.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3',
    'button[aria-label*="Send"]'
  ];
  
  for (const selector of selectors) {
    const sendBtn = document.querySelector(selector);
    if (sendBtn) {
      console.log('Found SEND button, clicking...');
      sendBtn.click();
      return;
    }
  }
  
  console.log('SEND button not found - manual send required');
}

async function logEmail(emailData) {
  const logEntry = {
    to: emailData.to,
    company: emailData.company,
    role: emailData.role,
    timestamp: new Date().toISOString(),
    subject: emailData.subject,
    status: 'sent'
  };
  
  const result = await chrome.storage.local.get(['logs', 'stats']);
  const logs = result.logs || [];
  const stats = result.stats || { totalSent: 0, todaySent: 0 };
  
  logs.unshift(logEntry);
  stats.totalSent++;
  stats.todaySent++;
  
  if (logs.length > 100) logs.pop();
  
  await chrome.storage.local.set({ logs, stats });
  console.log('Email logged successfully');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('Recruiter Mail Bot content script loaded and ready');
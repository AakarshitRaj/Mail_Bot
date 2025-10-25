class AIHelper {
  constructor(apiKey, provider = 'gemini') {
    this.apiKey = apiKey;
    this.provider = provider;
  }
  
  async enhanceEmail(emailText, context) {
    if (!this.apiKey) return emailText;
    try {
      if (this.provider === 'gemini') {
        return await this.enhanceWithGemini(emailText, context);
      }
      return emailText;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return emailText;
    }
  }
  
  async enhanceWithGemini(emailText, context) {
    const prompt = 'Rewrite this job application email to sound more natural and professional for ' + 
      context.company + ' (' + context.role + ' position). Keep it concise under 200 words.\n\n' + emailText;
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + this.apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || emailText;
  }
  
  getRandomGreeting(name) {
    const greetings = ['Dear ' + name + ',', 'Hello ' + name + ',', 'Hi ' + name + ','];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  getRandomClosing() {
    const closings = ['Best regards', 'Sincerely', 'Kind regards', 'Thank you'];
    return closings[Math.floor(Math.random() * closings.length)];
  }
}
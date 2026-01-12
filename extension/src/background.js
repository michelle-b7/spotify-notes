// Background service worker for Spotify Notes Extension
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID; // Must match App.jsx
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// Listen for messages from the web app
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.type === 'SPOTIFY_AUTH_SUCCESS') {
      // Store the access token
      chrome.storage.local.set({
        spotify_access_token: request.token,
        spotify_token_timestamp: Date.now()
      }, () => {
        console.log('Spotify token stored successfully');
        sendResponse({ success: true });
      });
      return true; // Keep channel open for async response
    }
  }
);

// Check token expiration and refresh if needed
async function checkTokenExpiration() {
  const result = await chrome.storage.local.get([
    'spotify_access_token',
    'spotify_token_timestamp'
  ]);
  
  if (result.spotify_token_timestamp) {
    const hoursSinceAuth = (Date.now() - result.spotify_token_timestamp) / (1000 * 60 * 60);
    
    // Spotify tokens expire after 1 hour
    if (hoursSinceAuth >= 1) {
      console.log('Token expired, user needs to re-authenticate');
      // Clear expired token
      await chrome.storage.local.remove(['spotify_access_token', 'spotify_token_timestamp']);
      
      // Notify user to re-authenticate
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ff0000' });
    }
  }
}

// Check token every 30 minutes
chrome.alarms.create('checkToken', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkToken') {
    refreshAccessToken();
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open setup page on first install
    chrome.tabs.create({
      url: 'http://127.0.0.1:5173'
    });
  }
});

// Clear badge when popup is opened
chrome.action.onClicked.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});
// Listen for the message from the Web App
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type && event.data.type === "SPOTIFY_AUTH_SUCCESS") {
    // Forward the token to the background script
    chrome.runtime.sendMessage({
      type: 'SPOTIFY_AUTH_SUCCESS',
      token: event.data.token
    });
  }
});
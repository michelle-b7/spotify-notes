import React, { useState, useEffect } from 'react';
import { Music, CheckCircle, Chrome, ArrowRight, Loader } from 'lucide-react';

// --- PKCE Utility Functions ---
// These functions are required to securely generate the code challenge and verifier.

function dec2hex(dec) {
  return ('0' + dec.toString(16)).substr(-2);
}

function generateRandomString(length) {
  const array = new Uint32Array(length / 2);
  // Using Web Crypto API for secure random strings
  if (typeof window.crypto === 'undefined' || typeof window.crypto.getRandomValues === 'undefined') {
    console.error("Crypto API not available.");
    return Math.random().toString(36).substring(2, length + 2);
  }
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}

function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(a) {
  // Convert ArrayBuffer to base64url string
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(v) {
  const hashed = await sha256(v);
  return base64urlencode(hashed);
}

// --- Component Implementation ---

const SpotifyNotesSetup = () => {
  const [authStep, setAuthStep] = useState('welcome'); // welcome, authenticating, exchanging, success, error
  const [userProfile, setUserProfile] = useState(null);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Spotify OAuth config - REPLACE WITH YOUR OWN
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_PUBLIC_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  // Note: 'user-read-email' is necessary to fetch the user profile
  const SCOPES = 'playlist-read-private playlist-read-collaborative user-library-read user-read-email';
  
  // Spotify's token exchange endpoint
  const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
  // Spotify's authorization endpoint
  const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
  // Spotify's profile endpoint
  const PROFILE_ENDPOINT = 'https://api.spotify.com/v1/me';

  useEffect(() => {
    // 1. Handle callback from Spotify
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (code) {
      // Clear URL params
      window.history.replaceState(null, '', window.location.origin + window.location.pathname);
      handleCodeCallback(code);
    } else if (error) {
      setAuthError(`Authentication failed: ${error}`);
      setAuthStep('error');
      // Clear URL params
      window.history.replaceState(null, '', window.location.origin + window.location.pathname);
    }

    // 2. Check extension status
    checkExtensionInstalled();
  }, []);

  const checkExtensionInstalled = () => {
    // In a real application, you would check for a specific chrome.runtime.sendMessage 
    // response or window message from a content script.
    // For this demonstration, we simulate it as false.
    setExtensionInstalled(false); 
  };

  // 3. Initiate Login (PKCE Step 1: Redirect to Spotify)
  const handleSpotifyLogin = async () => {
    if (CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') {
      alert('⚠️ ERROR: Please replace YOUR_SPOTIFY_CLIENT_ID in the code.');
      return;
    }

    setAuthStep('authenticating');
    setAuthError(null);

    // PKCE Generation
    const state = generateRandomString(16);
    const code_verifier = generateRandomString(128);
    const code_challenge = await generateCodeChallenge(code_verifier);

    // Store verifier and state
    localStorage.setItem('spotify_auth_state', state);
    localStorage.setItem('spotify_code_verifier', code_verifier);

    const authUrl = AUTH_ENDPOINT + '?' +
      `client_id=${CLIENT_ID}&` +
      `response_type=code&` + // 🟢 PKCE CHANGE
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `state=${state}&` +
      `code_challenge_method=S256&` + // 🟢 PKCE REQUIREMENT
      `code_challenge=${code_challenge}`; // 🟢 PKCE REQUIREMENT

    window.location.href = authUrl;
  };

  // 4. Handle Code Callback (PKCE Step 2: Exchange Code for Token)
  const handleCodeCallback = async (code) => {
    setAuthStep('exchanging');
    const code_verifier = localStorage.getItem('spotify_code_verifier');
    
    if (!code_verifier) {
        setAuthError("PKCE verification failed. Code verifier missing.");
        setAuthStep('error');
        return;
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: code_verifier
    });

    try {
        const response = await fetch(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });
        
        const data = await response.json();
        
        if (data.access_token) {
            // Store both tokens for the webapp
            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.setItem('spotify_refresh_token', data.refresh_token); // NEW
            localStorage.setItem('spotify_token_timestamp', Date.now().toString());

            // Send both to the extension
            sendTokenToExtension(data.access_token, data.refresh_token);
            handleAuthSuccess(data.access_token);
        } else {
            setAuthError(`Token exchange failed: ${data.error_description || data.error}`);
            setAuthStep('error');
        }

    } catch (error) {
        console.error('Error during token exchange:', error);
        setAuthError('An unexpected network error occurred.');
        setAuthStep('error');
    }
    
    // Clean up PKCE secrets regardless of success/failure
    localStorage.removeItem('spotify_code_verifier');
    localStorage.removeItem('spotify_auth_state');
  };


  // 5. Final Success Handler
  const handleAuthSuccess = async (accessToken) => {
    try {
      // Fetch user profile
      const response = await fetch(PROFILE_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const profile = await response.json();

      if (response.ok) {
        // Store token for extension to use (still using localStorage for this setup page)
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_token_timestamp', Date.now().toString());

        setUserProfile(profile);
        setAuthStep('success');

        // Send token to extension if installed (assuming content script listens via window.postMessage)
        sendTokenToExtension(accessToken);
      } else {
        setAuthError(`Profile fetch failed: ${profile.error.message}`);
        setAuthStep('error');
      }

      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_token_timestamp', Date.now().toString());

      // Communication: Use the Extension ID to send a direct message
      const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID; // Get this from chrome://extensions
      
      if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(EXTENSION_ID, {
          type: 'SPOTIFY_AUTH_SUCCESS',
          token: accessToken
        }, (response) => {
          if (response?.success) console.log("Extension notified!");
        });
      }
      
      // Fallback for the content script method
      window.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', token: accessToken }, "*");
      
      setAuthStep('success');   

    } catch (error) {
      console.error('Error fetching profile:', error);
      setAuthError('Failed to fetch user profile.');
      setAuthStep('error');
    }
  };

  const sendTokenToExtension = (token, refreshToken) => {
    // This is the standard way a web app communicates with a content script/extension
    window.postMessage({
      type: 'SPOTIFY_AUTH_SUCCESS',
      token: token,
      refreshToken: refreshToken
    }, '*');
  };

  // --- Render Logic ---

  const renderContent = () => {
    switch (authStep) {
      case 'welcome':
        return (
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Get Started
            </h2>
            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Connect Your Spotify Account</h3>
                  <p className="text-gray-600 text-sm">We'll securely access your playlists using the required PKCE flow.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Install Chrome Extension</h3>
                  <p className="text-gray-600 text-sm">Add the extension to start taking notes.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Start Adding Notes</h3>
                  <p className="text-gray-600 text-sm">Click any song on Spotify to add your thoughts and memories.</p>
                </div>
              </div>
            </div>
            {/* Login Button */}
            <button
              onClick={handleSpotifyLogin}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 group"
            >
              <Music className="w-5 h-5" />
              Connect with Spotify
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-xs text-gray-500 text-center">
              We only request read access to your playlists. Your notes are stored locally.
            </p>
          </div>
        );

      case 'authenticating':
      case 'exchanging':
        return (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Loader className="animate-spin w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {authStep === 'authenticating' ? 'Redirecting to Spotify...' : 'Exchanging Code for Token...'}
            </h2>
            <p className="text-gray-600">
              Please wait while we establish a secure connection.
            </p>
          </div>
        );

      case 'error':
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center">
                    <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-semibold text-red-900 mb-2">Authentication Failed</h2>
                    <p className="text-red-700">{authError || "An unknown error occurred."}</p>
                </div>
                <button
                    onClick={() => setAuthStep('welcome')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                    Try Connecting Again
                </button>
            </div>
        );

      case 'success':
        return (
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Successfully Connected!
              </h2>
              {userProfile && (
                <p className="text-gray-600">
                  Welcome, **{userProfile.display_name}**!
                </p>
              )}
            </div>
            {/* Next Step Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Next Step: Install the Chrome Extension
              </h3>
              {!extensionInstalled ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Chrome className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">
                          Installation Instructions
                        </h4>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                          <li>Download the extension files</li>
                          <li>Open Chrome and go to <code className="font-mono">chrome://extensions/</code></li>
                          <li>Enable "Developer mode" (top right)</li>
                          <li>Click "Load unpacked" and select the extension folder</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Download Extension Files
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-semibold">
                    Extension Detected!
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    You're all set to start adding notes to your songs
                  </p>
                </div>
              )}
            </div>
            {/* Authentication Details */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Your Authentication Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-semibold">Connected</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Account:</span>
                  <span className="text-gray-900">{userProfile?.email || userProfile?.id || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">Spotify Notes Setup</h1>
          </div>
          <p className="text-lg text-gray-600">
            Add personal notes to every song in your playlists
          </p>
        </div>
        
        {/* Main Content Area */}
        <div className="max-w-2xl mx-auto">
          {renderContent()}
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Track Your Music</h3>
            <p className="text-sm text-gray-600">
              Add notes to any song in your playlists and library
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fully Private</h3>
            <p className="text-sm text-gray-600">
              All notes are stored locally on your device
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Chrome className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy Access</h3>
            <p className="text-sm text-gray-600">
              Quick access from your Chrome toolbar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyNotesSetup;
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_PUBLIC_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

export async function loginWithSpotify() {
  const state = crypto.randomUUID();
  const verifier = crypto.randomUUID() + crypto.randomUUID();

  localStorage.setItem('spotify_state', state);
  localStorage.setItem('spotify_verifier', verifier);

  const challenge = await pkceChallenge(verifier);

  const url =
    `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=user-read-email user-read-private` +
    `&state=${state}` +
    `&code_challenge_method=S256` +
    `&code_challenge=${challenge}`;

  window.location.href = url;
}

export async function handleCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');

  if (!code) return null;

  const verifier = localStorage.getItem('spotify_verifier');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const data = await res.json();
  localStorage.setItem('spotify_access_token', data.access_token);

  window.history.replaceState({}, '', '/');
  return data.access_token;
}

async function pkceChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

import {useEffect, useRef} from 'react'
import {loginWithSpotify, handleCallback} from '../auth/spotifyAuth';
import {Music} from 'lucide-react';

export default function Login({ onAuth }) {
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    handleCallback().then(token => {
      if (token) {
        onAuth(token);
        window.history.replaceState({}, document.title, "/");
      }
    });
  }, [onAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-gray-100">
        <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200 rotate-3">
          <Music className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Spotify Notes</h1>
        <p className="text-gray-500 mb-8">Your music, your memories. All in one place.</p>
        
        <button 
          onClick={loginWithSpotify}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" className="w-6 h-6" alt="Spotify" />
          Connect with Spotify
        </button>
        
        <p className="mt-6 text-xs text-gray-400">
          Secure authentication powered by Spotify OAuth.
        </p>
      </div>
    </div>
  );
}
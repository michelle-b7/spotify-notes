import {useEffect, useState} from 'react';
import {getNewReleases} from '../api/spotifyApi';
import PlaylistGrid from '../components/PlaylistGrid';
import SearchBar from '../components/SearchBar';
import {Music, AlertCircle} from 'lucide-react';

export default function Dashboard({token , onLogout}) {
  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    async function load() {
        try {
        const data = await getNewReleases(token);
        setAlbums(data.albums.items);
        } catch (err) {
        if (err.status === 401) {
            onLogout(); 
        } else {
            setError(err.message);
        }
        }
    }
    load();
    }, [token, onLogout]);
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3 text-green-600">
            <Music className="w-8 h-8" />
            <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
          </div>
          <button onClick={onLogout} className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors">
            Logout
          </button>
        </header>

        <SearchBar token={token} />

        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-8 bg-green-500 rounded-full" />
          <h2 className="text-xl font-bold text-gray-800">My Playlists</h2>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-6 border border-red-100 flex gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}
        
        <PlaylistGrid albums={albums} />
      </div>
    </div>
  );
}
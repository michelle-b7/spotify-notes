import {useState} from 'react';
import {Search, Loader} from 'lucide-react';
import TrackList from './TrackList';
import {searchTracks} from '../api/spotifyApi';
import {useAuth} from '../auth/AuthContext';

export default function SearchBar() {
  const {token} = useAuth();
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!query) return;
    setIsSearching(true);
    const data = await searchTracks(token, query);
    setTracks(data.tracks.items);
    setIsSearching(false);
  }

  return (
    <div className="max-w-2xl mx-auto mb-10">
      <form onSubmit={submit} className="relative group">
        <input
          placeholder="Search for a song to add your notes..."
          className="w-full py-4 pl-14 pr-6 bg-white border border-gray-200 rounded-2xl shadow-sm group-hover:shadow-md focus:shadow-lg focus:border-green-300 outline-none transition-all text-lg"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
          {isSearching ? <Loader className="animate-spin w-6 h-6" /> : <Search className="w-6 h-6" />}
        </div>
      </form>
      <TrackList tracks={tracks} />
    </div>
  );
}

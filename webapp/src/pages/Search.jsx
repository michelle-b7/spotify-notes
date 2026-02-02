import {useState} from 'react';
import {search} from '../api/spotifyApi';
import Note from './Note';

export default function Search({ token }) {
  const [q, setQ] = useState('');
  const [tracks, setTracks] = useState([]);
  const [selected, setSelected] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const res = await search(token, q);
    setTracks(res.tracks.items);
  }

  if (selected) {
    return <Note token={token} trackId={selected} /*onBack={() => setSelected(null)}*/ />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={submit} className="mb-6">
        <input 
          className="w-full p-3 rounded-xl border border-gray-200"
          placeholder="Search songs..."
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
      </form>

      <div className="space-y-3">
        {tracks.map(t => (
          <div 
            key={t.id} 
            onClick={() => setSelected(t.id)}
            className="flex items-center gap-4 p-2 hover:bg-green-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-green-100"
          >
            <img 
              src={t.album.images[0]?.url} 
              alt={t.name} 
              className="w-12 h-12 rounded shadow-sm object-cover"
            />
            
            <div>
              <p className="font-semibold text-gray-900">{t.name}</p>
              <p className="text-sm text-gray-500">{t.artists[0].name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
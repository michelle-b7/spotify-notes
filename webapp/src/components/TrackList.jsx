import {useState} from 'react'; 
import {Music, ChevronRight} from 'lucide-react';
import Note from '../pages/Note';

// generated once enter is pressed on search 

export default function TrackList({tracks, token}) {
  const [selected, setSelected] = useState(null);

  // if a track is selected, show the Note page
  if (selected) {
    return <Note trackId={selected} />;
  }
  // don't render anything if no search has happened yet
  if (!tracks || tracks.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      {tracks.map(track => (
        <button
          key={track.id}
          onClick={() => setSelected(track.id)}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition text-left"
        >
          <div className="flex items-center gap-4">
            {track.album?.images?.[0]?.url ? (
              <img
                src={track.album.images[0].url}
                alt={track.name}
                className="w-12 h-12 rounded-md"
              />
            ) : (
              <Music className="w-10 h-10 text-gray-400" />
            )}

            <div>
              <p className="font-medium">{track.name}</p>
              <p className="text-sm text-gray-500">
                {track.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>

          <ChevronRight className="text-gray-400" />
        </button>
      ))}
    </div>
  );
}
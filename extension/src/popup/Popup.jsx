import React, { useState, useEffect } from 'react';
import { Music, Search, Plus, Edit2, Save, X, ChevronRight } from 'lucide-react';

const SpotifyNotesExtension = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [notes, setNotes] = useState({});
  const [editingTrack, setEditingTrack] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthentication();
    loadNotes();
  }, []);

  const checkAuthentication = async () => {
    // Check chrome storage instead of localStorage for shared persistence
    chrome.storage.local.get(['spotify_access_token'], (result) => {
      if (result.spotify_access_token) {
        setIsAuthenticated(true);
        fetchPlaylists(result.spotify_access_token);
      }
    });
  };

  const loadNotes = async () => {
    const result = await chrome.storage.local.get(['track_notes']);
    if (result.track_notes) {
      setNotes(result.track_notes);
    }
  };

  const saveNotes = async (updatedNotes) => {
    await chrome.storage.local.set({ track_notes: updatedNotes });
    setNotes(updatedNotes);
  };

  const fetchPlaylists = async (token) => {
    setLoading(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPlaylists(data.items || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
    setLoading(false);
  };

  const fetchPlaylistTracks = async (playlistId) => {
    setLoading(true);
    const token = localStorage.getItem('spotify_access_token');
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      const data = await response.json();
      setTracks(data.items || []);
      setSelectedPlaylist(playlistId);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
    setLoading(false);
  };

  const handleSaveNote = () => {
    if (!editingTrack) return;
    
    const updatedNotes = {
      ...notes,
      [editingTrack]: noteText
    };
    
    saveNotes(updatedNotes);
    setEditingTrack(null);
    setNoteText('');
  };

  const handleEditNote = (trackId, currentNote) => {
    setEditingTrack(trackId);
    setNoteText(currentNote || '');
  };

  const handleDeleteNote = (trackId) => {
    const updatedNotes = { ...notes };
    delete updatedNotes[trackId];
    saveNotes(updatedNotes);
  };

  const openSetupPage = () => {
    window.open('http://127.0.0.1:5173', '_blank');
  };

  const filteredTracks = tracks.filter(item => {
    if (!searchQuery) return true;
    const track = item.track;
    return (
      track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artists[0]?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (!isAuthenticated) {
    return (
      <div className="w-96 h-[600px] bg-gradient-to-br from-green-50 to-white p-6 flex flex-col items-center justify-center">
        <Music className="w-16 h-16 text-green-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Spotify Notes
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Connect your Spotify account to start adding notes to your songs :)
        </p>
        <button
          onClick={openSetupPage}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="w-96 h-[600px] bg-white flex flex-col">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-6 h-6" />
          <h1 className="text-lg font-bold">Spotify Notes</h1>
        </div>
        {selectedPlaylist && (
          <button
            onClick={() => setSelectedPlaylist(null)}
            className="text-sm text-green-100 hover:text-white flex items-center gap-1"
          >
            ← Back to Playlists
          </button>
        )}
      </div>

      {/* Search Bar */}
      {selectedPlaylist && (
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
          </div>
        ) : !selectedPlaylist ? (
          /* Playlists List */
          <div className="p-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Playlists</h2>
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => fetchPlaylistTracks(playlist.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  {playlist.images[0] ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-12 h-12 rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <Music className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {playlist.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {playlist.tracks.total} tracks
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Tracks List */
          <div className="divide-y">
            {filteredTracks.map((item) => {
              const track = item.track;
              const hasNote = notes[track.id];
              const isEditing = editingTrack === track.id;

              return (
                <div key={track.id} className="p-3 hover:bg-gray-50">
                  <div className="flex gap-3">
                    {track.album?.images[0] && (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {track.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {track.artists.map(a => a.name).join(', ')}
                      </p>
                      
                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add your notes..."
                            className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows="3"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveNote}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTrack(null)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-2 px-3 rounded flex items-center justify-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : hasNote ? (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-xs text-gray-700 whitespace-pre-wrap">
                            {notes[track.id]}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleEditNote(track.id, notes[track.id])}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNote(track.id)}
                              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditNote(track.id, '')}
                          className="mt-2 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add note
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyNotesExtension;
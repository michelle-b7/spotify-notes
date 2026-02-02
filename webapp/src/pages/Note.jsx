import {useEffect, useState} from 'react';
import {getTrack} from '../api/spotifyApi';
import NoteEditor from '../components/NoteEditor';


export default function Note({ token, trackId, onBack }) {
  const [track, setTrack] = useState(null);

  useEffect(() => {
    getTrack(token, trackId).then(setTrack);
  }, [token, trackId]);

  if (!track) return (
    <p> loader smth </p>
  );

  return (
    <p> notes </p>
  );
}
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {getTrack} from '../api/spotifyApi';
import {useAuth} from '../auth/AuthContext';
import NoteEditor from '../components/NoteEditor';

export default function Note() {
  const {trackId} = useParams();
  const {token} = useAuth();
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

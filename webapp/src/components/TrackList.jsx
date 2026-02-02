import {useState} from 'react'; 
import {Music, ChevronRight} from 'lucide-react';
import Note from '../pages/Note';

// generated once enter is pressed on search 

export default function TrackList({tracks}) {
  const [selected, setSelected] = useState(null);
  if (selected) return <Track trackId={selected} />;

  return (
    
    <p></p>
  );
}
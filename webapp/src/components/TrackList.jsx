import {useNavigate} from 'react-router-dom';
import {Music, ChevronRight} from 'lucide-react';

export default function TrackList({tracks, token}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  if (selected) return <Note trackId={selected} />;

  return (
    <p></p>
  );
}

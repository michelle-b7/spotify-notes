export async function spotifyFetch(token, endpoint) {
  const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok) {
    
    // Attach the status to the error so Dashboard can see it
    const error = new Error(data.error?.message || 'Spotify API error');
    error.status = res.status; 
    throw error;
  }

  return data;
}

export function getNewReleases(token) {
  return spotifyFetch(token, 'browse/new-releases');
}

export function searchTracks(token, q) {
  return spotifyFetch(
    token,
    `search?q=${encodeURIComponent(q)}&type=track`
  );
}

export function getTrack(token, id) {
  return spotifyFetch(token, `tracks/${id}`);
}

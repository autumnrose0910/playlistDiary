// script.js (Updated to include playlist name, cover, and metadata stats)

window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const loginBtn = document.getElementById('loginBtn');
    const playlistSection = document.getElementById('playlistSection');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const playlistInput = document.getElementById('playlistInput');
    const resultContainer = document.getElementById('resultContainer');
  
    if (token) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (playlistSection) playlistSection.style.display = 'block';
    }
  
    analyzeBtn.addEventListener('click', async () => {
      const url = playlistInput.value.trim();
      const playlistId = extractPlaylistId(url);
  
      if (!playlistId) {
        resultContainer.innerHTML = '<p>Please enter a valid Spotify playlist URL.</p>';
        return;
      }
  
      resultContainer.innerHTML = '<p>Loading playlist info...</p>';
      const stats = await fetchPlaylistMetadata(playlistId, token);
      displayStats(stats);
    });
  });
  
  function extractPlaylistId(url) {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)(\?si=.*)?/);
    return match ? match[1] : null;
  }
  
  async function fetchPlaylistMetadata(playlistId, token) {
    const headers = { Authorization: `Bearer ${token}` };
  
    try {
      const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, { headers });
      const playlistMeta = await playlistRes.json();
  
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers });
      const data = await res.json();
  
      const trackItems = data.items
        .filter(item => item.track && item.track.id && item.track.artists.length > 0);
  
      const durations = trackItems.map(item => item.track.duration_ms);
      const popularity = trackItems.map(item => item.track.popularity);
      const explicitCount = trackItems.filter(item => item.track.explicit).length;
      const artistIds = [...new Set(trackItems.flatMap(item => item.track.artists.map(a => a.id)))].slice(0, 50);
  
      const artistRes = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`, { headers });
      const artistData = await artistRes.json();
  
      const allGenres = artistData.artists.flatMap(a => a.genres);
      const genreCounts = {};
      allGenres.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1);
  
      return {
        playlistName: playlistMeta.name,
        playlistImage: playlistMeta.images[0]?.url,
        ownerName: playlistMeta.owner.display_name,
        trackCount: trackItems.length,
        avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length / 60000).toFixed(2),
        avgPopularity: (popularity.reduce((a, b) => a + b, 0) / popularity.length).toFixed(1),
        explicitPercent: ((explicitCount / trackItems.length) * 100).toFixed(0),
        topGenres: Object.entries(genreCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      };
    } catch (err) {
      console.error('Error fetching playlist metadata:', err);
      return null;
    }
  }
  
  function displayStats(stats) {
    const resultContainer = document.getElementById('resultContainer');
    if (!stats) {
      resultContainer.innerHTML = '<p>Oops! Couldn\'t fetch playlist data.</p>';
      return;
    }
  
    const genresList = stats.topGenres.map(g => `<li>${g[0]} (${g[1]} tracks)</li>`).join('');
  
    resultContainer.innerHTML = `
      <div class="playlist-header">
        <img src="${stats.playlistImage}" alt="Playlist cover" style="width: 150px; border-radius: 12px; margin-bottom: 10px;"/>
        <h2>${stats.playlistName}</h2>
        <p>by ${stats.ownerName}</p>
      </div>
      <ul>
        <li><strong>Total Tracks:</strong> ${stats.trackCount}</li>
        <li><strong>Average Duration:</strong> ${stats.avgDuration} minutes</li>
        <li><strong>Average Popularity:</strong> ${stats.avgPopularity}/100</li>
        <li><strong>Explicit Content:</strong> ${stats.explicitPercent}%</li>
      </ul>
      <h3>Top Genres</h3>
      <ul>${genresList}</ul>
    `;
  }
  


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
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers });
      const data = await res.json();
  
      const trackItems = data.items
        .filter(item => item.track && item.track.id && item.track.artists.length > 0);
  
      const durations = trackItems.map(item => item.track.duration_ms);
      const popularity = trackItems.map(item => item.track.popularity);
      const artistIds = [...new Set(trackItems.flatMap(item => item.track.artists.map(a => a.id)))].slice(0, 50);
  
      const artistRes = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`, { headers });
      const artistData = await artistRes.json();
  
      const allGenres = artistData.artists.flatMap(a => a.genres);
      const genreCounts = {};
      allGenres.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1);
  
      return {
        trackCount: trackItems.length,
        avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length / 60000).toFixed(2),
        avgPopularity: (popularity.reduce((a, b) => a + b, 0) / popularity.length).toFixed(1),
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
      <h2>Playlist Metadata Analysis</h2>
      <ul>
        <li><strong>Total Tracks:</strong> ${stats.trackCount}</li>
        <li><strong>Average Duration:</strong> ${stats.avgDuration} minutes</li>
        <li><strong>Average Popularity:</strong> ${stats.avgPopularity}/100</li>
      </ul>
      <h3>Top Genres</h3>
      <ul>${genresList}</ul>
    `;
  }
  

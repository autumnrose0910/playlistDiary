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
  
      const artistNames = trackItems.flatMap(item => item.track.artists.map(a => a.name));
      const artistCounts = {};
      artistNames.forEach(name => artistCounts[name] = (artistCounts[name] || 0) + 1);
  
      return {
        playlistName: playlistMeta.name,
        playlistImage: playlistMeta.images[0]?.url,
        ownerName: playlistMeta.owner.display_name,
        trackCount: trackItems.length,
        avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length / 60000).toFixed(2),
        avgPopularity: (popularity.reduce((a, b) => a + b, 0) / popularity.length).toFixed(1),
        explicitPercent: ((explicitCount / trackItems.length) * 100).toFixed(0),
        topArtists: Object.entries(artistCounts)
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
  
    const artistList = stats.topArtists.map(a => `<div class="artist-item">${a[0]} <span>(${a[1]} tracks)</span></div>`).join('');
  
    resultContainer.innerHTML = `
      <div class="results-flex" style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 900px; margin: auto; padding: 1rem;">
  
        <div style="display: flex; flex-direction: column; gap: 1rem;" class="results-grid">
          <div class="playlist-info" style="flex: 1; text-align: center;">
            <img src="${stats.playlistImage}" alt="Playlist cover" style="width: 100%; max-width: 180px; border-radius: 12px; margin-bottom: 10px;"/>
            <h2 style="margin: 0; font-size: 1.2rem;">${stats.playlistName}</h2>
            <p style="margin: 4px 0; font-style: italic; font-size: 0.9rem;">by ${stats.ownerName}</p>
          </div>
  
          <div class="playlist-stats" style="flex: 1;">
            <h3 style="font-size: 1.1rem;">Stats</h3>
            <div><strong>Total Tracks:</strong> ${stats.trackCount}</div>
            <div><strong>Average Duration:</strong> ${stats.avgDuration} min</div>
            <div><strong>Average Popularity:</strong> ${stats.avgPopularity}/100</div>
            <div><strong>Explicit Content:</strong> ${stats.explicitPercent}%</div>
          </div>
  
          <div class="playlist-artists" style="flex: 1;">
            <h3 style="font-size: 1.1rem;">Top Artists</h3>
            ${artistList}
          </div>
        </div>
  
        <style>
          @media (min-width: 768px) {
            .results-grid {
              flex-direction: row;
              justify-content: space-between;
            }
          }
        </style>
      </div>
    `;
  }
  
  
  

const token = localStorage.getItem('access_token');
if (token) {
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('playlistSection').style.display = 'block';
}


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
        resultContainer.innerHTML = "<p>Please enter a valid Spotify playlist URL.</p>";
        return;
      }
  
      resultContainer.innerHTML = "<p>Loading playlist info...</p>";
      const stats = await fetchAndAnalyzePlaylist(playlistId, token);
      displayStats(stats);
    });
  });
  
  function extractPlaylistId(url) {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)(\?si=.*)?/);
    return match ? match[1] : null;
  }

  
  async function fetchAndAnalyzePlaylist(playlistId, token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
  
    //find tracks
      const trackRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers
      });
      const trackData = await trackRes.json();
  
      const trackIds = trackData.items
        .map(item => item.track && item.track.id)
        .filter(id => id !== null)
        .slice(0, 100); //temp limit for testing
  
      //audio features
      const audioRes = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`, {
        headers
      });
      const audioData = await audioRes.json();
  
      // averages
      const stats = {
        count: audioData.audio_features.length,
        avgTempo: 0,
        avgDanceability: 0,
        avgEnergy: 0,
        avgValence: 0,
      };
  
      audioData.audio_features.forEach(f => {
        stats.avgTempo += f.tempo;
        stats.avgDanceability += f.danceability;
        stats.avgEnergy += f.energy;
        stats.avgValence += f.valence;
      });
  
      const n = audioData.audio_features.length;
      for (let key in stats) {
        if (key !== "count") stats[key] = (stats[key] / n).toFixed(2);
      }
  
      return stats;
  
    } catch (err) {
      console.error("Error analyzing playlist:", err);
      return null;
    }
  }

  
  function displayStats(stats) {
    const resultContainer = document.getElementById('resultContainer');
    if (!stats) {
      resultContainer.innerHTML = "<p>Oops! Couldn't fetch playlist data.</p>";
      return;
    }
  
    resultContainer.innerHTML = `
      <h2>Playlist Analysis</h2>
      <ul>
        <li><strong>Total Tracks:</strong> ${stats.count}</li>
        <li><strong>Average Tempo:</strong> ${stats.avgTempo} BPM</li>
        <li><strong>Average Danceability:</strong> ${stats.avgDanceability}</li>
        <li><strong>Average Energy:</strong> ${stats.avgEnergy}</li>
        <li><strong>Average Positivity (Valence):</strong> ${stats.avgValence}</li>
      </ul>
    `;
  }
  

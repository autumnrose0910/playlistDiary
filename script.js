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
      if (!token) {
        resultContainer.innerHTML = "<p>Please log in to Spotify first.</p>";
        return;
      }
  
      const url = playlistInput.value.trim();
      const playlistId = extractPlaylistId(url);
      console.log("URL entered:", url);
      console.log("Extracted playlist ID:", playlistId);
  
      if (!playlistId) {
        resultContainer.innerHTML = "<p>Please enter a valid Spotify playlist URL.</p>";
        return;
      }
  
      resultContainer.innerHTML = "<p>Loading playlist info...</p>";
      const stats = await fetchAndAnalyzePlaylist(playlistId, token);
      console.log("Fetched stats:", stats);
      displayStats(stats);
    });
  });
  
  function extractPlaylistId(url) {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)(\?si=.*)?/);
    return match ? match[1] : null;
  }
  
  function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  async function fetchAndAnalyzePlaylist(playlistId, token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      console.log("Using playlist ID:", playlistId);
  
      // Fetch tracks
      const trackRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers });
      const trackData = await trackRes.json();
  
      const trackIds = trackData.items
        .map(item => item.track && item.track.id)
        .filter(id => id !== null && id !== undefined)
        .slice(0, 100); // limit for now
  
      const chunks = chunkArray(trackIds, 50);
      let allFeatures = [];
  
      for (const chunk of chunks) {
        const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${chunk.join(',')}`, { headers });
        const data = await res.json();
  
        if (res.status !== 200 || data.error) {
          console.warn("Audio feature fetch failed for chunk:", chunk, data);
          continue;
        }
  
        allFeatures.push(...(data.audio_features || []).filter(f => f));
      }
  
      if (allFeatures.length === 0) return null;
  
      const stats = {
        count: allFeatures.length,
        avgTempo: 0,
        avgDanceability: 0,
        avgEnergy: 0,
        avgValence: 0,
      };
  
      allFeatures.forEach(f => {
        stats.avgTempo += f.tempo;
        stats.avgDanceability += f.danceability;
        stats.avgEnergy += f.energy;
        stats.avgValence += f.valence;
      });
  
      const n = allFeatures.length;
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
  

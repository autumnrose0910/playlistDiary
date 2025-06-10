
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
    const match = url.match(/playlist\/([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1] : null;
  }  

  
  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }
  
  async function fetchAudioFeatures(trackIds, headers) {
    const chunks = chunkArray(trackIds, 10); // Safer size for debugging
    let allFeatures = [];
  
    for (const chunk of chunks) {
      const url = `https://api.spotify.com/v1/audio-features?ids=${chunk.join(',')}`;
      const res = await fetch(url, { headers });
  
      if (!res.ok) {
        const err = await res.json();
        console.warn("Audio feature fetch failed for chunk:", chunk, err);
        continue; // Skip this chunk
      }
  
      const data = await res.json();
      const validFeatures = data.audio_features.filter(f => f); // Remove nulls
      allFeatures = allFeatures.concat(validFeatures);
    }
  
    return allFeatures;
  }
  
  async function fetchAndAnalyzePlaylist(playlistId, token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      console.log("Using playlist ID:", playlistId);
  
      // Fetch playlist tracks
      const trackRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers });
      if (!trackRes.ok) {
        const err = await trackRes.json();
        console.error("Track fetch failed:", err);
        return null;
      }
  
      const trackData = await trackRes.json();
  
      const trackIds = trackData.items
        .map(item => item?.track?.id)
        .filter(id => typeof id === 'string' && id.length === 22)
        .slice(0, 100); // Optional limit
  
      if (trackIds.length === 0) {
        console.warn("No valid track IDs found.");
        return null;
      }
  
      // Fetch audio features in chunks
      const audioFeatures = await fetchAudioFeatures(trackIds, headers);
  
      if (audioFeatures.length === 0) {
        alert("No audio features could be fetched. Some tracks may be restricted.");
        return null;
      }
  
      // Compute stats
      const stats = {
        count: audioFeatures.length,
        avgTempo: 0,
        avgDanceability: 0,
        avgEnergy: 0,
        avgValence: 0,
      };
  
      audioFeatures.forEach(f => {
        stats.avgTempo += f.tempo;
        stats.avgDanceability += f.danceability;
        stats.avgEnergy += f.energy;
        stats.avgValence += f.valence;
      });
  
      const n = audioFeatures.length;
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
  

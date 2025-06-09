const token = localStorage.getItem('access_token');
if (token) {
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('playlistSection').style.display = 'block';
  // Optional: auto-fill playlist or fetch user’s own playlists
}

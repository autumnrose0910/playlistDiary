const clientId = '202e43b25213442bb4c7e81dce7ba60f';
const redirectUri = 'https://playlist-diary.vercel.app/callback'; // Must match your Spotify Dev settings

// PKCE string gen
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => possible[x % possible.length])
    .join('');
}

// create a SHA256 hash, then base64-url encode it
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

//  Auth URL redirect
async function redirectToSpotifyLogin() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem('code_verifier', codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'playlist-read-private playlist-read-collaborative playlist-read-public user-library-read',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });
  

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

window.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', redirectToSpotifyLogin);
  }
});

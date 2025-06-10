const clientId = '202e43b25213442bb4c7e81dce7ba60f';
const redirectUri = 'https://playlist-diary.vercel.app/callback';
const codeVerifier = localStorage.getItem('code_verifier');

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (!code) {
  console.error("No code found in URL");
  document.body.innerText = "Authorization code not found.";
} else {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
    .then(res => res.json())
    .then(data => {
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);

        window.location.href = '/';
      } else {
        console.error("Failed to get access token", data);
        document.body.innerText = "Authorization failed. Please try again.";
      }
    })
    .catch(err => {
      console.error("Error during token fetch:", err);
      document.body.innerText = "Something went wrong. Please try again.";
    });
}

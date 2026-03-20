const BEARER = "Os27RJHKBnsgDPe41hqGp2mwlben4pAqoYJRVtqT3Xb8DPLPyqg68U0PSv97LyRovrU9machEcR4YKs0613wn7ihHExxyfwwZ9jm9FmiJk9TQVBv2qRyqjhCpMqCDPD4XXxBkeBKqd1BXFzooDK9YZy1FupchMXRqydrGP7ULYRacVHpECiGDkK4cu2JVaIKejAVxUB6Mj1s01gJ9zIohYc0ssuPedapD8wtUlyd21VdFViHl5lWr3RWVbsUAysv";
const TOKEN = "nv6pV2e5V7VevRlnNjZKJnoUXEIu8iWCNURrhVk4";
const BASE = "https://api.autoconf.com.br";

async function tryRequest(label, url, options) {
  console.log(`\n=== ${label} ===`);
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    if (text.length > 0) console.log(`Body: ${text.slice(0, 500)}`);
    // Show response headers for 403s
    if (res.status === 403) {
      const hdrs = {};
      res.headers.forEach((v, k) => hdrs[k] = v);
      console.log("Headers:", JSON.stringify(hdrs));
    }
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

async function main() {
  // Maybe the token IS the bearer and the Bearer we have is wrong
  await tryRequest("Token AS Bearer", `${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  // Maybe Token header (capital T)
  await tryRequest("Token header (capital)", `${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BEARER}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Token": TOKEN
    },
    body: JSON.stringify({})
  });

  // Maybe token in body as "token" not "revenda_token"
  await tryRequest("token in body", `${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BEARER}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token: TOKEN })
  });

  // Maybe no Bearer at all, just token
  await tryRequest("No bearer, just token body", `${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ revenda_token: TOKEN })
  });

  // FormData with multipart
  const formBody = new FormData();
  formBody.append("revenda_token", TOKEN);
  await tryRequest("FormData multipart", `${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BEARER}`,
      "Accept": "application/json"
    },
    body: formBody
  });

  // Try with both tokens swapped
  await tryRequest("Tokens swapped", `${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ revenda_token: BEARER })
  });

  // Try POST /api/v1/veiculo (singular) with different combos
  await tryRequest("POST /api/v1/veiculo JSON", `${BASE}/api/v1/veiculo`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BEARER}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ revenda_token: TOKEN })
  });

  await tryRequest("POST /api/v1/veiculo form", `${BASE}/api/v1/veiculo`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BEARER}`,
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `revenda_token=${TOKEN}`
  });
}

main();


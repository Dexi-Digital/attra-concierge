const BEARER = "Os27RJHKBnsgDPe41hqGp2mwlben4pAqoYJRVtqT3Xb8DPLPyqg68U0PSv97LyRovrU9machEcR4YKs0613wn7ihHExxyfwwZ9jm9FmiJk9TQVBv2qRyqjhCpMqCDPD4XXxBkeBKqd1BXFzooDK9YZy1FupchMXRqydrGP7ULYRacVHpECiGDkK4cu2JVaIKejAVxUB6Mj1s01gJ9zIohYc0ssuPedapD8wtUlyd21VdFViHl5lWr3RWVbsUAysv";
const TOKEN = "nv6pV2e5V7VevRlnNjZKJnoUXEIu8iWCNURrhVk4";
const BASE = "https://api.autoconf.com.br";

async function tryRequest(label, url, options) {
  console.log(`\n=== ${label} ===`);
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text.slice(0, 500)}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

async function main() {
  // 1. POST JSON with revenda_token in body
  await tryRequest("POST JSON body", `${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BEARER}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ revenda_token: TOKEN })
  });

  // 2. POST form-urlencoded
  await tryRequest("POST form-urlencoded", `${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BEARER}`,
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `revenda_token=${TOKEN}`
  });

  // 3. POST with token as header
  await tryRequest("POST token as header", `${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${BEARER}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "revenda-token": TOKEN
    },
    body: JSON.stringify({})
  });

  // 4. Scan other v1 endpoints
  const paths = [
    "api/v1/veiculo", "api/v1/estoque", "api/v1/marcas",
    "api/v1/brands", "api/v1/stock", "api/v1/models",
    "api/v1/search", "api/v1/consulta"
  ];
  console.log("\n=== Scanning endpoints ===");
  for (const path of paths) {
    try {
      const res = await fetch(`${BASE}/${path}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${BEARER}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ revenda_token: TOKEN })
      });
      console.log(`${res.status} - POST /${path}`);
    } catch (err) {
      console.log(`ERR - POST /${path}: ${err.message}`);
    }
  }

  // 5. Try GET endpoints
  const getPaths = [
    "api/v1/veiculos", "api/v1/marcas", "api/v1/brands",
    "api/v1/estoque", "api/v1/modelos"
  ];
  console.log("\n=== GET endpoints ===");
  for (const path of getPaths) {
    try {
      const res = await fetch(`${BASE}/${path}?revenda_token=${TOKEN}`, {
        headers: {
          "Authorization": `Bearer ${BEARER}`,
          "Accept": "application/json"
        }
      });
      console.log(`${res.status} - GET /${path}`);
      if (res.status === 200) {
        const text = await res.text();
        console.log(`  Body: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      console.log(`ERR - GET /${path}: ${err.message}`);
    }
  }
}

main();


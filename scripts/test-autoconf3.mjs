const AUTH = "Os27RJHKBnsgDPe41hqGp2mwlben4pAqoYJRVtqT3Xb8DPLPyqg68U0PSv97LyRovrU9machEcR4YKs0613wn7ihHExxyfwwZ9jm9FmiJk9TQVBv2qRyqjhCpMqCDPD4XXxBkeBKqd1BXFzooDK9YZy1FupchMXRqydrGP7ULYRacVHpECiGDkK4cu2JVaIKejAVxUB6Mj1s01gJ9zIohYc0ssuPedapD8wtUlyd21VdFViHl5lWr3RWVbsUAysv";
const TOKEN = "nv6pV2e5V7VevRlnNjZKJnoUXEIu8iWCNURrhVk4";
const BASE = "https://api.autoconf.com.br";

async function main() {
  console.log("=== POST /api/v1/veiculos (correct format) ===");
  try {
    const res = await fetch(`${BASE}/api/v1/veiculos`, {
      method: "POST",
      headers: {
        "Authorization": AUTH,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ token: TOKEN })
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body (first 2000 chars): ${text.slice(0, 2000)}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

main();


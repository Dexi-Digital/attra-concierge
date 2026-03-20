import { writeFileSync } from "fs";

const AUTH = "Os27RJHKBnsgDPe41hqGp2mwlben4pAqoYJRVtqT3Xb8DPLPyqg68U0PSv97LyRovrU9machEcR4YKs0613wn7ihHExxyfwwZ9jm9FmiJk9TQVBv2qRyqjhCpMqCDPD4XXxBkeBKqd1BXFzooDK9YZy1FupchMXRqydrGP7ULYRacVHpECiGDkK4cu2JVaIKejAVxUB6Mj1s01gJ9zIohYc0ssuPedapD8wtUlyd21VdFViHl5lWr3RWVbsUAysv";
const TOKEN = "nv6pV2e5V7VevRlnNjZKJnoUXEIu8iWCNURrhVk4";
const BASE = "https://api.autoconf.com.br";

async function main() {
  // Fetch page 1
  const res = await fetch(`${BASE}/api/v1/veiculos`, {
    method: "POST",
    headers: {
      "Authorization": AUTH,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ token: TOKEN })
  });
  const data = await res.json();
  writeFileSync("scripts/autoconf-response.json", JSON.stringify(data, null, 2));
  console.log(`Saved ${data.count} vehicles, page ${data.pagina_atual}/${data.ultima_pagina}`);
  
  // Show first vehicle fields
  if (data.veiculos && data.veiculos.length > 0) {
    console.log("\nFirst vehicle keys:", Object.keys(data.veiculos[0]).join(", "));
    console.log("\nFirst vehicle sample:", JSON.stringify(data.veiculos[0], null, 2).slice(0, 3000));
  }
}

main().catch(console.error);


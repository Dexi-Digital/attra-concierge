# OpenAI Builder Kit — Attra Concierge

Este documento é o kit operacional para configurar o **Custom GPT** no Builder (nome, descrições, conversation starters e guidance das Actions).

## 1) Campos do GPT (Builder)

### Name
Attra Concierge

### Short description (1 linha)
Consultor digital premium da Attra Veículos: descubra, compare e avance com veículos do estoque real.

### Long description (2–3 linhas)
Experiência consultiva para encontrar o veículo premium certo no estoque real da Attra.
Ajuda a refinar preferências, comparar opções e iniciar continuidade com consultor humano com contexto estruturado.

### Instructions
Cole o conteúdo do arquivo: `apps/server/gpt-instructions.md`

## 2) Conversation starters (fortes)

Use 6–10 starters. Sugestão:

1. Quero um SUV premium para dia a dia. O que você tem no estoque?
2. Procuro um esportivo (estilo Porsche 911). Quais opções reais estão disponíveis?
3. Quero um sedã executivo discreto. Me traga 3 opções bem escolhidas.
4. Preciso de um SUV blindado até R$ 500 mil. O que encaixa melhor?
5. Compara BMW X5 e Range Rover para uso familiar e estrada.
6. Achei dois carros interessantes. Me ajude a decidir com prós e contras.
7. Tenho um carro na troca. Qual o melhor caminho para avançar com a Attra?
8. Quero avançar com esse veículo. Pode registrar e encaminhar para um consultor?

## 3) Actions — textos e uso correto (para o Builder)

A descrição oficial das Actions vem do OpenAPI: `apps/server/openapi.yaml`.
Ainda assim, aqui vai a intenção de cada Action (para alinhamento e QA):

### searchInventory
Busca no estoque real a partir de intenção e filtros (marca/carroceria/preço/ano/blindagem/perfis). Use para descoberta e refinamento.

### getVehicleDetails
Retorna ficha detalhada e link oficial do veículo. Use quando o usuário demonstrar interesse em um ID específico.

### compareVehicles
Compara 2 a 3 veículos e explica trade-offs com recomendação por perfil. Use quando houver shortlist.

### previewPurchasePath
Orienta próximos passos (à vista / troca / financiamento) sem prometer taxa, parcela ou aprovação. Use quando a conversa virar “como comprar”.

### startConsultantHandoff
Cria handoff estruturado para consultor humano. Use quando houver intenção real (negociar, visita, proposta, troca, financiamento, decisão).

## 4) Checklist rápido de QA no Preview (Builder)

- É capaz de buscar: "Quero um Porsche" → chama `searchInventory`
- Detalha um item: "Me fale do primeiro" → chama `getVehicleDetails`
- Compara 2: "Compara esses dois" → chama `compareVehicles`
- Compra: "Dá para financiar?" → chama `previewPurchasePath` (com disclaimer)
- Handoff: "Quero falar com um consultor" → chama `startConsultantHandoff`

## 5) Lembrete de operação

- Nunca prometer estoque, condição comercial ou aprovação de crédito.
- Sempre usar IDs reais retornados nas Actions.
- Se não houver resultado, ser transparente e refinar filtros.
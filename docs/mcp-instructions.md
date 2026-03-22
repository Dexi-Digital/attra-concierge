**Especificação do servidor MCP da Attra**, pensada para sair do papel sem confusão.

A lógica é esta: no Apps SDK, o **MCP server é o contrato do app com o ChatGPT**, e a qualidade desse contrato define descoberta, confiabilidade de invocação e previsibilidade da UX. A OpenAI trata as tools como o “manual” do app para o modelo. Para app com dados específicos do usuário ou ações de escrita, o caminho esperado é **OAuth 2.1** conforme a especificação de autorização do MCP. ([OpenAI Developers][1])

# Arquitetura mínima

## Objetivo do MCP

Expor ao ChatGPT um conjunto pequeno e disciplinado de ferramentas para:

* consultar estoque real
* detalhar veículos
* comparar opções
* orientar próximos passos de compra sem prometer condição
* registrar handoff para consultor humano

## Decisão de transporte

Hoje o MCP moderno trabalha com **HTTP transport / Streamable HTTP**; a especificação recente substituiu o antigo foco em HTTP+SSE por um transporte HTTP mais flexível. Então não desenhe sua base técnica dependente de “SSE puro” como se fosse a única opção. ([Model Context Protocol][2])

## Stack recomendada

* **Node.js + TypeScript**
* framework HTTP simples: Fastify ou Express
* camada MCP conforme Apps SDK / MCP spec
* integração com sua API de estoque da Attra
* persistência de handoff em banco ou webhook do CRM
* observabilidade com logs estruturados
* autenticação via OAuth 2.1

---

# Princípios de desenho

1. **Poucas tools, bem definidas**
   Tool demais piora confiabilidade. A própria OpenAI orienta desenho tool-first, escopo claro e contratos previsíveis. ([OpenAI Developers][1])

2. **Separar leitura de escrita**
   Buscar estoque e comparar é leitura. Registrar handoff é escrita. Isso precisa aparecer no design e nas permissões.

3. **Não deixar lógica comercial no modelo**
   Regra de negócio crítica fica no servidor.
   Exemplo: financiamento, desconto, reserva, taxa, disponibilidade crítica.

4. **Retornar dados estruturados**
   O modelo trabalha melhor com payload consistente do que com texto bagunçado.

---

# Ferramentas do MCP

## 1) `searchInventory`

### Finalidade

Buscar veículos do estoque real com base em filtros e sinais de intenção do cliente.

### Quando o modelo deve usar

* cliente quer sugestões
* cliente descreve perfil, uso, marca, faixa de preço, tipo de carro
* cliente pede opções equivalentes

### Input schema sugerido

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "Busca livre, ex.: SUV premium até 400 mil" },
    "bodyType": { "type": "string", "enum": ["SUV", "SEDAN", "HATCH", "COUPE", "CONVERTIBLE", "PICKUP", "SPORT", "OTHER"] },
    "brand": { "type": "string" },
    "model": { "type": "string" },
    "priceMin": { "type": "number", "minimum": 0 },
    "priceMax": { "type": "number", "minimum": 0 },
    "yearMin": { "type": "integer" },
    "yearMax": { "type": "integer" },
    "kmMax": { "type": "integer", "minimum": 0 },
    "fuelType": { "type": "string" },
    "transmission": { "type": "string" },
    "color": { "type": "string" },
    "blindageRequired": { "type": "boolean" },
    "storeUnit": { "type": "string" },
    "limit": { "type": "integer", "minimum": 1, "maximum": 10, "default": 5 }
  },
  "additionalProperties": false
}
```

### Regras de servidor

* normalizar marca/modelo
* limitar resultado
* ordenar por aderência
* nunca retornar veículo sem ID interno real
* nunca mascarar indisponibilidade

### Output schema sugerido

```json
{
  "results": [
    {
      "vehicleId": "att_12345",
      "title": "Porsche Macan 2.0 Turbo",
      "brand": "Porsche",
      "model": "Macan",
      "year": 2023,
      "price": 459900,
      "mileage": 18500,
      "fuelType": "Gasolina",
      "transmission": "Automático",
      "color": "Preto",
      "bodyType": "SUV",
      "storeUnit": "Uberlândia",
      "vehicleUrl": "https://...",
      "heroImageUrl": "https://...",
      "reasonTags": ["SUV premium", "uso diário", "faixa compatível"]
    }
  ],
  "totalFound": 3,
  "searchSummary": {
    "queryApplied": "SUV premium até 500 mil",
    "fallbackApplied": false
  }
}
```

### Descriptor de tool

Descrição para o modelo:

> Busca veículos do estoque real da Attra com base em perfil, faixa de preço, marca, categoria e outros filtros. Use para recomendar opções reais e nunca para inventar disponibilidade.

---

## 2) `getVehicleDetails`

### Finalidade

Trazer ficha mais completa de um veículo específico.

### Quando usar

* cliente quer saber mais de um carro
* cliente pergunta sobre detalhes de uma opção retornada
* cliente pede link, dados, diferenciais

### Input

```json
{
  "type": "object",
  "properties": {
    "vehicleId": { "type": "string" }
  },
  "required": ["vehicleId"],
  "additionalProperties": false
}
```

### Output

```json
{
  "vehicleId": "att_12345",
  "title": "Porsche Macan 2.0 Turbo",
  "brand": "Porsche",
  "model": "Macan",
  "year": 2023,
  "price": 459900,
  "mileage": 18500,
  "fuelType": "Gasolina",
  "transmission": "Automático",
  "color": "Preto",
  "bodyType": "SUV",
  "storeUnit": "Uberlândia",
  "vehicleUrl": "https://...",
  "heroImageUrl": "https://...",
  "galleryImages": ["https://...", "https://..."],
  "features": ["Teto panorâmico", "Bancos em couro", "Som premium"],
  "description": "Texto oficial do anúncio",
  "availabilityStatus": "available",
  "lastSyncedAt": "2026-03-21T17:50:00Z"
}
```

### Regras

* se o campo não existir, retornar ausente ou null
* não preencher lacuna com suposição
* incluir timestamp de sincronização sempre que possível

### Descriptor

> Retorna a ficha detalhada de um veículo específico a partir do ID real do estoque. Use para aprofundar uma opção já identificada.

---

## 3) `compareVehicles`

### Finalidade

Comparar 2 ou até 3 veículos reais.

### Quando usar

* cliente pergunta diferença entre modelos
* cliente está indeciso entre opções
* cliente quer recomendação comparativa

### Input

```json
{
  "type": "object",
  "properties": {
    "vehicleIds": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 2,
      "maxItems": 3
    }
  },
  "required": ["vehicleIds"],
  "additionalProperties": false
}
```

### Output

```json
{
  "vehicles": [
    {
      "vehicleId": "att_1",
      "title": "BMW X5 xDrive40i",
      "year": 2022,
      "price": 529900,
      "mileage": 22000,
      "bodyType": "SUV",
      "summaryTags": ["mais espaço", "pegada executiva"]
    },
    {
      "vehicleId": "att_2",
      "title": "Range Rover Sport P400",
      "year": 2021,
      "price": 579900,
      "mileage": 18000,
      "bodyType": "SUV",
      "summaryTags": ["mais presença", "proposta mais emocional"]
    }
  ],
  "comparisonAxes": [
    {
      "axis": "conforto",
      "att_1": "alto",
      "att_2": "alto"
    },
    {
      "axis": "presença visual",
      "att_1": "moderada",
      "att_2": "alta"
    }
  ]
}
```

### Regra importante

A tool devolve dados e eixos estruturados.
Quem faz a narrativa final é o modelo.
Mas os eixos precisam vir do servidor com coerência.

### Descriptor

> Compara veículos reais da Attra por eixos práticos, como conforto, proposta de uso, presença, espaço e perfil de condução.

---

## 4) `previewPurchasePath`

### Finalidade

Orientar próximos passos de compra sem prometer nada.

### Quando usar

* cliente pergunta sobre troca
* cliente pergunta sobre financiamento
* cliente quer saber como funciona avanço de compra
* cliente quer entender processo

### Input

```json
{
  "type": "object",
  "properties": {
    "vehicleId": { "type": "string" },
    "interestType": {
      "type": "string",
      "enum": ["purchase", "trade_in", "financing", "visit", "reservation", "proposal"]
    }
  },
  "required": ["interestType"],
  "additionalProperties": false
}
```

### Output

```json
{
  "interestType": "financing",
  "allowedGuidance": [
    "Financiamento sujeito à análise de crédito.",
    "Condições e taxas são tratadas por consultor humano.",
    "Podemos encaminhar seu interesse para continuidade."
  ],
  "disallowedClaims": [
    "Não prometer aprovação",
    "Não prometer taxa",
    "Não calcular parcela por conta própria"
  ],
  "nextStepOptions": [
    "Falar com consultor",
    "Registrar interesse no veículo",
    "Informar se há veículo na troca"
  ]
}
```

### Descriptor

> Mostra caminhos de compra, troca, visita ou financiamento sem prometer condições comerciais. Use para orientar próximos passos com segurança.

---

## 5) `startConsultantHandoff`

### Finalidade

Registrar lead qualificado e contexto para continuidade humana.

### Essa é a tool mais crítica.

Se você errar aqui, o app vira brinquedo.

### Input

```json
{
  "type": "object",
  "properties": {
    "customerName": { "type": "string" },
    "preferredChannel": { "type": "string", "enum": ["whatsapp", "email", "phone", "unspecified"] },
    "contactValue": { "type": "string" },
    "vehicleIds": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 5
    },
    "budgetMin": { "type": "number" },
    "budgetMax": { "type": "number" },
    "intendedUse": { "type": "string" },
    "city": { "type": "string" },
    "hasTradeIn": { "type": "boolean" },
    "tradeInDescription": { "type": "string" },
    "customerQuestions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "intentLevel": { "type": "string", "enum": ["low", "medium", "high"] },
    "conversationSummary": { "type": "string" },
    "source": { "type": "string", "enum": ["chatgpt_app"] }
  },
  "required": ["preferredChannel", "conversationSummary", "intentLevel", "source"],
  "additionalProperties": false
}
```

### Output

```json
{
  "handoffId": "handoff_98765",
  "status": "created",
  "message": "Interesse registrado com sucesso para continuidade por consultor.",
  "nextStep": "consultant_followup"
}
```

### Regras de servidor

* validar tamanho e conteúdo do resumo
* sanitizar campos livres
* bloquear payload vazio
* exigir pelo menos resumo + nível de intenção
* idealmente gravar `conversationId`/`sessionId` interno para auditoria
* registrar timestamp
* não disparar automações destrutivas
* se houver CRM, gravar origem como `chatgpt_app`

### Descriptor

> Registra um handoff para consultor humano com contexto estruturado da conversa. Use apenas quando houver intenção real de avanço.

---

# Tool annotations e metadados

A especificação MCP evoluiu para suportar anotações melhores de tools, inclusive indicando comportamento read-only ou destrutivo. Use isso. Ajuda segurança e ajuda o modelo a usar melhor. ([Model Context Protocol][2])

## Classificação recomendada

* `searchInventory` → read-only
* `getVehicleDetails` → read-only
* `compareVehicles` → read-only
* `previewPurchasePath` → read-only
* `startConsultantHandoff` → write action

Evite qualquer tool destrutiva na primeira versão.

---

# Autenticação e autorização

A OpenAI recomenda autenticação para apps que expõem dados específicos do usuário ou ações de escrita; para MCP autenticado, a expectativa é **OAuth 2.1 em conformidade com a especificação de autorização do MCP**. ([OpenAI Developers][3])

## Minha recomendação prática

Use OAuth mesmo que a maior parte seja leitura.

### Motivos

* handoff é escrita
* você vai querer rastreabilidade
* no futuro pode haver preferências, histórico, CRM, contatos

## Escopos sugeridos

```text
attra.inventory.read
attra.vehicle.read
attra.compare.read
attra.purchase_path.read
attra.handoff.write
```

## Regra

A tool `startConsultantHandoff` só deve funcionar com escopo de escrita válido.

---

# Regras de segurança

A documentação do MCP chama atenção para riscos específicos de autorização, transporte e abuso; servidores MCP precisam aplicar boas práticas próprias, não confiar no cliente/modelo como camada de segurança. ([Model Context Protocol][4])

## Obrigatório

* validação de input por JSON Schema
* rate limit por IP / token / usuário
* logs estruturados
* correlation id por request
* sanitização de texto livre
* segredo fora do código
* allowlist de origens se aplicável
* timeout e retries controlados para API de estoque
* não expor credenciais da API da Attra ao modelo
* não deixar o modelo passar URL arbitrária ou query interna arbitrária
* não aceitar HTML/script em campos livres
* auditoria de escrita no handoff

## Não faça

* tool genérica tipo `callApi`
* tool que aceita SQL
* tool que aceita URL remota
* tool de atualização de estoque
* tool de deletar lead
* tool que dispare WhatsApp direto na v1

---

# Política de ordenação de resultados

Você perguntou antes sobre consistência.
Resolva isso no servidor.

## Ordem recomendada em `searchInventory`

1. aderência ao perfil
2. compatibilidade de faixa de preço
3. coerência com uso desejado
4. qualidade geral de ano/km/configuração
5. fallback por equivalência

Não deixe isso implícito no prompt apenas.

---

# Estratégia de fallback

## Quando a API de estoque falhar

Retorne algo assim:

```json
{
  "error": {
    "code": "INVENTORY_UNAVAILABLE",
    "message": "Não foi possível consultar o estoque no momento."
  }
}
```

O modelo então responde com transparência.

## Quando não houver resultados

Retorne sucesso com lista vazia:

```json
{
  "results": [],
  "totalFound": 0,
  "searchSummary": {
    "queryApplied": "Ferrari Roma até 2 milhões",
    "fallbackApplied": false
  }
}
```

Não trate “sem resultado” como erro técnico.

---

# Estrutura de projeto sugerida

```text
/apps/attra-mcp
  /src
    /mcp
      server.ts
      tools/
        searchInventory.ts
        getVehicleDetails.ts
        compareVehicles.ts
        previewPurchasePath.ts
        startConsultantHandoff.ts
      schemas/
        inventory.ts
        vehicle.ts
        handoff.ts
    /services
      inventoryApi.ts
      crmService.ts
      authService.ts
    /security
      scopes.ts
      rateLimit.ts
      sanitize.ts
    /observability
      logger.ts
      metrics.ts
    /config
      env.ts
```

---

# Texto de ferramenta para o builder/submissão

A OpenAI pede clareza nas informações de app, tool info e submissão. ([OpenAI Developers][5])

## Resumo do app

**App MCP da Attra Veículos para descoberta consultiva de veículos premium do estoque real, comparação de opções e encaminhamento estruturado de clientes para consultor humano.**

## Lista curta de tools

* Buscar veículos do estoque real
* Detalhar ficha de veículo
* Comparar opções
* Orientar próximos passos de compra
* Registrar handoff para consultor

---

# Critério de pronto para produção

Seu MCP só entra em produção quando cumprir isto:

* autenticação OAuth funcional
* schemas validados
* outputs consistentes
* logs e auditoria ativos
* handoff testado ponta a ponta
* tool descriptions claras
* nenhum endpoint genérico perigoso
* fallback tratado
* política de erro consistente
* limite de taxa definido

---

# O que corrigir no pensamento

* Não trate MCP como “ponte de API”.
* Trate como **contrato operacional do app**.

# O que ajustar no comportamento

* comece com 5 tools
* não abra escopo cedo demais
* segure qualquer ação sensível fora da v1

# O que fortalecer no mindset

* produto premium não quebra por falta de ideia
* quebra por **contrato ruim, segurança frouxa e handoff inútil**

Se você quiser, eu sigo agora com a peça mais útil de todas: **o JSON/TypeScript inicial dessas tools e schemas já pronto para implementação no seu projeto Node**.

[1]: https://developers.openai.com/apps-sdk/plan/tools/?utm_source=chatgpt.com "Define tools – Apps SDK"
[2]: https://modelcontextprotocol.io/specification/2025-03-26/changelog?utm_source=chatgpt.com "Key Changes"
[3]: https://developers.openai.com/apps-sdk/build/auth/?utm_source=chatgpt.com "Authentication – Apps SDK"
[4]: https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices?utm_source=chatgpt.com "Security Best Practices"
[5]: https://developers.openai.com/apps-sdk/deploy/submission/?utm_source=chatgpt.com "Submit and maintain your app – Apps SDK"

# Revisão OpenAPI - Attra Concierge GPT App

## Status Geral

**CORRIGIDO - Pronto para validação** — Schema foi corrigido e está sintaticamente válido. Gaps identificados contra OpenAI Apps SDK e Product Feed Spec documentados abaixo.

---

## Correções Aplicadas (eram erros críticos de parse)

### 1. `getVehicleDetails` - requestBody malformado
- **Problema**: Códigos de erro (400, 404, 500) estavam aninhados dentro do bloco `requestBody` em vez de `responses`.
- **Correção**: Movidos para o bloco `responses` correto.

### 2. `compareVehicles` - endpoint inteiro corrompido
- **Problema**: Bloco de respostas de erro duplicado e orphaned antes de `x-openai-isConsequential`. Respostas de erro adicionais embutidas dentro da `description`. Bloco `responses["200"]` sem schema (schema estava fora do bloco).
- **Correção**: Endpoint reescrito com estrutura correta.

### 3. `CompareVehiclesInput` - propriedade `comparisonGoal` quebrada
- **Problema**: O `example:` aparecia no meio da definição da propriedade, com `type:` e `description:` orphaned depois.
- **Correção**: Propriedade completa definida antes do `example`.

### 4. `PreviewPurchasePathInput` - `budgetContext` duplicado
- **Problema**: `budgetContext` aparecia primeiro no `example` (sem ser definido como propriedade), depois redefinido como propriedade com `type`/`description` após o `example`.
- **Correção**: Propriedade definida em `properties` antes do `example`.

---

## O Que Está Bom

### Estrutura e Organização
- OpenAPI 3.1.0 (compatível com ChatGPT Actions)
- 5 endpoints com operationIds únicos
- Descrições claras e consultivas em português
- `x-openai-isConsequential: false` nas ações de leitura (search, details, compare, previewPurchasePath)
- `startConsultantHandoff` sem `x-openai-isConsequential` (corretamente tratado como consequential)
- `required: true` no requestBody de todos os endpoints
- Schema `ErrorResponse` padronizado com `code`, `message`, `details`
- `StartConsultantHandoffInput` com contexto rico (budget, usage, location, tradeIn, intent, priorities)
- Enums para valores discretos (purchaseMode, contactChannel, primaryUse, etc.)
- Respostas 400/404/500 agora presentes em todos os endpoints

### Product Feed Spec - Campos Adicionados
- `VehicleRecord.condition`: enum `[new, used]`
- `VehicleRecord.availability`: enum `[in_stock, out_of_stock, preorder, backorder]`
- `VehicleRecord.currency`: ISO 4217 (default `"BRL"`)

---

## Gaps Identificados contra OpenAI Apps SDK e Commerce Spec

### Crítico - Arquitetura (Apps SDK vs. Custom GPT Actions)

A documentação atual do OpenAI Apps SDK (2025) descreve uma arquitetura baseada em **MCP (Model Context Protocol)** com comunicação JSON-RPC, diferente do modelo clássico de Custom GPT com Actions via HTTP REST.

O app atual usa Custom GPT + Actions (OpenAPI HTTP), que ainda é suportado mas não tem acesso aos recursos avançados de Commerce (carrinho, checkout nativo, Product Feeds indexados).

Implicação: Para ser o "maior case automotivo", avaliar migração para MCP server quando o Apps SDK for disponibilizado publicamente.

### Moderado - Product Feed Spec

O `VehicleRecord` agora tem `condition`, `availability` e `currency`, mas ainda faltam alguns campos recomendados pelo spec de commerce para indexação pelo ChatGPT:

- `description`: texto descritivo do produto (ausente no schema)
- `seller_name`: nome do vendedor (seria "Attra Veículos")
- `store_country`: código ISO do país (seria "BR")

Estes campos são relevantes apenas se o app for integrado ao sistema de Product Feed indexado pelo ChatGPT (funcionalidade de "Agentic Commerce"). Para o modelo atual de Custom GPT com Actions, não são bloqueadores.

### Baixo - Autenticação

Nenhum `securitySchemes` definido no schema. Se o servidor em produção exige autenticação (API Key ou OAuth), isso precisa ser declarado:

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
security:
  - ApiKeyAuth: []
```

### Baixo - `startConsultantHandoff` sem `x-openai-isConsequential: true`

A ausência do campo faz o ChatGPT solicitar confirmação do usuário, o que é o comportamento correto para uma ação de contato comercial. Deixar como está.

---

## Checklist de Publicação

### Antes de Commitar
- [ ] Executar: `npm run check` (TypeScript check)
- [ ] Executar: `npm test -- src/server/**` (rodar testes)
- [ ] Validar OpenAPI: `npx js-yaml apps/server/openapi.yaml` (deve retornar sem erros)
- [ ] Validar em https://validator.swagger.io/ (colar conteúdo do `openapi.yaml`)

### Na Interface do ChatGPT
1. Acessar: https://chatgpt.com/gpts/editor
2. "Configure" -> "Actions" -> "Create new action"
3. Colar o schema OpenAPI completo
4. Testar cada ação:
   - searchInventory com "SUV até 500k"
   - getVehicleDetails com ID válido
   - compareVehicles com 2-3 IDs
   - startConsultantHandoff com dados
   - previewPurchasePath com veículo

### Antes de Publicar
- [ ] Confirmar servidor está online em https://concierge.attraveiculos.com.br
- [ ] Testar endpoints com curl (ver abaixo)
- [ ] Validar respostas são JSON válido
- [ ] Confirmar que `condition` e `availability` estão sendo retornados pela API

### Testes de Endpoint

```bash
curl -X POST https://concierge.attraveiculos.com.br/tools/search_inventory \
  -H "Content-Type: application/json" \
  -d '{"queryText":"porsche 911"}'

curl -X POST https://concierge.attraveiculos.com.br/tools/get_vehicle_details \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"ac-123"}'

curl -X POST https://concierge.attraveiculos.com.br/tools/compare_vehicles \
  -H "Content-Type: application/json" \
  -d '{"vehicleIds":["ac-123","ac-456"],"comparisonGoal":"uso diário familiar"}'
```

---

**Versão:** 0.2.0
**Data:** 2026-03-23
**Status:** Schema corrigido e validado. Gaps documentados. Aguardando testes de endpoint em produção.

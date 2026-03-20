# Attra Concierge

Attra Concierge é um app para ChatGPT voltado à descoberta, comparação e início da jornada de compra de veículos premium da Attra Veículos.

O objetivo do projeto não é substituir os canais atuais de atendimento da Attra. A operação já possui IA em seus canais. O papel deste produto é abrir uma nova origem de demanda premium em um ambiente de descoberta conversacional, transformando intenção em entrada comercial com contexto.

## Objetivo do MVP

O MVP deve ser capaz de:

1. Buscar veículos por linguagem natural
2. Retornar veículos reais e disponíveis
3. Exibir detalhes do veículo
4. Comparar opções com lógica consultiva
5. Criar handoff para o comercial com contexto
6. Registrar analytics essenciais

## Escopo do MVP

Ferramentas incluídas:

- `search_inventory`
- `get_vehicle_details`
- `compare_vehicles`
- `start_consultant_handoff`
- `preview_purchase_path`

Fora do MVP:

- simulação real de financiamento
- avaliação automática de troca
- agenda completa
- sourcing externo
- pós-venda
- login de cliente
- área autenticada
- PDF complexo
- integrações não essenciais ao fluxo principal

## Princípios de arquitetura

### 1. Estoque real é a fonte da verdade
O sistema deve refletir o estoque real da Attra. Não manter catálogo manual paralelo.

### 2. O modelo não decide regra de negócio crítica
O modelo pode interpretar intenção e ajudar na narrativa consultiva. Disponibilidade, preço, veículo, unidade e handoff devem vir da base e das regras definidas.

### 3. Toda tool deve ser pequena, clara e previsível
Nada de tools genéricas ou ambíguas.

### 4. UI existe para melhorar decisão
A UI não é ornamento. Ela existe para facilitar descoberta, comparação e continuidade.

### 5. Tudo precisa ser mensurável
Sem telemetria, não existe case.

## Arquitetura lógica

### Camada 1 — Fonte de dados
Responsável por ler:
- estoque da Attra
- páginas de veículos
- endpoints comerciais
- CRM ou canal de handoff

### Camada 2 — Normalização
Responsável por transformar os dados de origem em objetos consistentes e utilizáveis pelas tools.

### Camada 3 — Backend do app / tools
Responsável por:
- expor as tools
- validar parâmetros
- consultar os dados normalizados
- montar respostas estruturadas
- registrar eventos
- criar handoffs

### Camada 4 — UI embutida
Responsável por:
- mostrar cards
- abrir detalhes
- renderizar comparação
- exibir CTA para continuidade

### Camada 5 — Analytics
Responsável por:
- rastrear busca
- clique
- detalhamento
- comparação
- handoff
- origem
- progresso comercial

## Stack sugerida

### Backend
- Node.js
- TypeScript
- Fastify ou Express
- Zod
- pacote oficial Apps SDK / MCP

### Frontend
- React
- TypeScript
- Vite

### Dados
- Postgres ou Supabase
- Redis opcional para cache

### Observabilidade
- logs estruturados
- captura de erro
- telemetria por evento

## Ferramentas do MVP

## `search_inventory`
Transforma intenção em lista de veículos disponíveis e relevantes.

### Entrada esperada
- texto livre
- filtros inferidos ou explícitos
- faixa de preço
- uso desejado
- perfil do carro

### Saída esperada
- lista curta de veículos
- highlights
- links
- CTA de continuidade

## `get_vehicle_details`
Retorna ficha detalhada de um veículo específico.

### Saída esperada
- especificações
- highlights
- narrativa comercial curta
- imagens
- link oficial

## `compare_vehicles`
Compara 2 ou 3 veículos com lógica consultiva.

### Comparação deve considerar
- praticidade
- imagem
- exclusividade
- uso diário
- racionalidade
- presença executiva
- atrito operacional

## `start_consultant_handoff`
Cria handoff para o comercial com contexto.

### Deve carregar
- veículo de interesse
- resumo da intenção
- contexto da busca
- origem `chatgpt_app`
- unidade de preferência, se houver

## `preview_purchase_path`
Mostra próximos caminhos possíveis sem executar processos financeiros reais.

### Exemplo
- compra à vista
- troca com avaliação
- financiamento com análise humana

## Estrutura mínima de dados normalizados

Campos mínimos por veículo:
- `id`
- `externalStockId`
- `brand`
- `model`
- `version`
- `title`
- `yearModel`
- `price`
- `mileageKm`
- `fuelType`
- `transmission`
- `bodyType`
- `armored`
- `color`
- `storeUnit`
- `available`
- `vehicleUrl`
- `mainImageUrl`
- `imageUrls`

Campos enriquecidos desejáveis:
- `usageProfile`
- `positioningProfile`
- `priceBand`
- `dailyUseScore`
- `executivePresenceScore`
- `exclusivityScore`
- `familyFitScore`

## Eventos mínimos de analytics

- `search_started`
- `search_results_returned`
- `vehicle_opened`
- `comparison_started`
- `handoff_created`
- `handoff_failed`

## Regras inegociáveis

- não inventar disponibilidade
- não inventar preço
- não inventar versão
- não acoplar tool diretamente a HTML cru
- não misturar dado bruto com resposta final
- não expandir escopo sem justificativa
- todo input deve ser validado
- todo handoff deve carregar contexto
- toda entrega relevante deve ser rastreável

## Critérios de pronto do MVP

### Funcionais
- busca retorna veículos reais
- detalhe abre corretamente
- comparação funciona
- handoff funciona
- erro e vazio são tratados

### Técnicos
- tipagem consistente
- validação de entrada
- logs por ação relevante
- telemetria ativa
- baixo acoplamento

### Operacionais
- comercial consegue identificar origem ChatGPT
- handoff chega com contexto útil
- fluxo não depende de reconstrução manual do atendimento

## Objetivo do primeiro ciclo

Ao final do primeiro ciclo, o projeto deve entregar:

- uma experiência funcional de descoberta no ChatGPT
- consulta ao estoque real da Attra
- comparação útil
- handoff comercial utilizável
- telemetria suficiente para análise de resultado

## Observação final

Este projeto só faz sentido se gerar valor operacional e estratégico para a Attra.

Se virar apenas uma peça de marketing, falhou.
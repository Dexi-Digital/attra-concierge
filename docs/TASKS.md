# TASKS — Attra Concierge

## Status geral do projeto
- [ ] Descoberta técnica concluída
- [ ] Fonte de dados definida
- [ ] Normalização estruturada
- [ ] Backend inicial criado
- [ ] UI inicial criada
- [ ] Tools do MVP implementadas
- [ ] Handoff comercial integrado
- [ ] Analytics mínimo ativo
- [ ] Ambiente de staging funcional
- [ ] Critérios de pronto atingidos

---

## Fase 1 — Fundamentos

### Produto e arquitetura
- [ ] Validar escopo fechado do MVP
- [ ] Confirmar fluxo principal do usuário
- [ ] Confirmar origem oficial do estoque
- [ ] Definir contratos das tools
- [ ] Definir KPIs do MVP

### Dados
- [ ] Mapear payload bruto do estoque
- [ ] Identificar campos obrigatórios e inconsistências
- [ ] Definir modelo normalizado de veículo
- [ ] Definir campos enriquecidos
- [ ] Definir estratégia de atualização/sync

### Engenharia
- [ ] Criar repositório base
- [ ] Configurar TypeScript
- [ ] Configurar lint e formatação
- [ ] Configurar estrutura backend/frontend
- [ ] Configurar variáveis de ambiente

---

## Fase 2 — Normalização e base de dados

### Banco / persistência
- [ ] Criar tabela `vehicles_normalized`
- [ ] Criar tabela `vehicle_profiles`
- [ ] Criar tabela `chatgpt_sessions`
- [ ] Criar tabela `chatgpt_events`
- [ ] Criar tabela `chatgpt_handoffs`

### Ingestão
- [ ] Criar serviço de ingestão do estoque
- [ ] Criar parser dos dados brutos
- [ ] Criar normalizador de veículos
- [ ] Criar rotina de update incremental
- [ ] Criar política de cache

### Qualidade de dados
- [ ] Tratar campos ausentes
- [ ] Tratar dados inválidos
- [ ] Criar fallback para imagens
- [ ] Definir política para indisponíveis
- [ ] Validar consistência de preço e versão

---

## Fase 3 — Backend do app

### Infra base
- [ ] Subir servidor backend
- [ ] Configurar validação com Zod
- [ ] Configurar logger estruturado
- [ ] Configurar tratamento de erro
- [ ] Configurar healthcheck

### Tool `search_inventory`
- [ ] Definir schema de entrada
- [ ] Definir schema de saída
- [ ] Implementar parser de intenção
- [ ] Implementar consulta à base normalizada
- [ ] Implementar highlights de resposta
- [ ] Logar evento `search_started`
- [ ] Logar evento `search_results_returned`

### Tool `get_vehicle_details`
- [ ] Definir schema de entrada
- [ ] Definir schema de saída
- [ ] Implementar consulta por ID
- [ ] Montar resposta detalhada
- [ ] Logar evento `vehicle_opened`

### Tool `compare_vehicles`
- [ ] Definir schema de entrada
- [ ] Definir schema de saída
- [ ] Implementar consulta de múltiplos veículos
- [ ] Implementar motor de comparação consultiva
- [ ] Logar evento `comparison_started`

### Tool `start_consultant_handoff`
- [ ] Definir schema de entrada
- [ ] Definir schema de saída
- [ ] Montar contexto consolidado
- [ ] Persistir handoff
- [ ] Integrar com CRM/WhatsApp
- [ ] Logar `handoff_created`
- [ ] Logar `handoff_failed`

### Tool `preview_purchase_path`
- [ ] Definir schema de entrada
- [ ] Definir schema de saída
- [ ] Criar respostas orientativas
- [ ] Garantir que não haja promessa indevida

---

## Fase 4 — UI embutida

### Estrutura
- [ ] Criar app frontend
- [ ] Configurar roteamento ou estado principal
- [ ] Configurar componentes base
- [ ] Configurar tratamento global de erro

### Componentes
- [ ] Criar `VehicleCard`
- [ ] Criar `VehicleGrid`
- [ ] Criar `VehicleDetailPanel`
- [ ] Criar `ComparisonPanel`
- [ ] Criar `HandoffPanel`
- [ ] Criar `EmptyState`
- [ ] Criar `ErrorState`
- [ ] Criar `LoadingState`

### UX
- [ ] Validar legibilidade dos cards
- [ ] Limitar quantidade de resultados na primeira resposta
- [ ] Validar fluxo de comparação
- [ ] Validar CTA de continuidade
- [ ] Validar comportamento em vazio e erro

---

## Fase 5 — Analytics e observabilidade

### Analytics
- [ ] Definir estrutura de eventos
- [ ] Registrar session_id
- [ ] Registrar origem do fluxo
- [ ] Persistir eventos relevantes
- [ ] Criar visão inicial de métricas

### Observabilidade
- [ ] Capturar erros críticos
- [ ] Criar logs por tool call
- [ ] Monitorar falhas de integração
- [ ] Monitorar tempo de resposta
- [ ] Monitorar taxa de handoff

---

## Fase 6 — Comercial e operação

### Handoff
- [ ] Definir dono operacional da origem ChatGPT
- [ ] Definir payload mínimo para o comercial
- [ ] Definir destino da integração
- [ ] Definir SLA para essa origem
- [ ] Validar retorno do handoff

### Processo
- [ ] Garantir identificação da origem `chatgpt_app`
- [ ] Validar recebimento no CRM
- [ ] Testar fluxo real com vendedor
- [ ] Testar continuidade após handoff
- [ ] Ajustar payload de contexto

---

## Fase 7 — Ambientes e preparação de lançamento

### Ambientes
- [ ] Configurar dev
- [ ] Configurar staging
- [ ] Configurar produção
- [ ] Separar segredos por ambiente
- [ ] Validar domínio público/HTTPS

### Validação
- [ ] Testar fluxo completo em staging
- [ ] Testar com estoque real ou espelho
- [ ] Testar vazios
- [ ] Testar falhas de integração
- [ ] Testar respostas inconsistentes

### Lançamento
- [ ] Checklist técnico final
- [ ] Checklist operacional final
- [ ] Checklist de métricas
- [ ] Material de validação interna
- [ ] Plano de rollout controlado

---

## Critérios de aceite do MVP

- [ ] Busca funcional com estoque real
- [ ] Detalhe funcional
- [ ] Comparação funcional
- [ ] Handoff funcional
- [ ] Analytics básicos ativos
- [ ] Tratamento de erro consistente
- [ ] Origem identificável no fluxo comercial
- [ ] Time operacional preparado para uso
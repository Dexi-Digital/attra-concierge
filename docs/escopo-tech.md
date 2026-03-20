Perfeito. A versão técnica correta para você e sua equipe não é “como fazer um app no GPT” em abstrato.
É: como executar o Attra Concierge sem virar projeto bonito e inútil.
A base oficial hoje é esta: apps para ChatGPT usam um servidor MCP como peça obrigatória, podem ter UI opcional renderizada dentro do ChatGPT, e a qualidade de nomes, descrições e parâmetros das tools influencia diretamente quando o ChatGPT decide usar o app. Publicação pública passa por submissão e depois publicação no diretório. (OpenAI Developers)
Guia técnico de execução
Attra Concierge
1. Objetivo técnico do projeto
Construir um app da Attra para ChatGPT capaz de:
consultar o estoque real da Attra;
interpretar busca por linguagem natural;
retornar veículos relevantes com contexto comercial;
comparar opções com lógica consultiva;
encaminhar o interesse para o comercial com contexto;
medir origem, uso e avanço comercial.
O objetivo técnico não é “subir um app”.
É criar uma nova camada de distribuição comercial conectada à operação real.

2. Princípios de arquitetura
A arquitetura deve obedecer cinco regras.
Regra 1 — o estoque é a fonte da verdade
Nada de manter catálogo paralelo manual.
O app deve ler o estoque real da Attra e refletir disponibilidade real.
Regra 2 — o modelo não decide regra de negócio crítica
O modelo interpreta intenção.
Mas disponibilidade, preço, link, unidade, status e handoff devem vir da base.
Regra 3 — tool pequena, específica e previsível
A OpenAI recomenda tools bem definidas, com nomes e descrições claros, porque isso aumenta recall nos prompts certos e reduz ativações erradas. (OpenAI Developers)
Regra 4 — UI só entra para melhorar decisão
A UI é opcional no Apps SDK. Ela deve existir aqui porque carro é visual e comparação melhora com componente gráfico, não porque “fica mais bonito”. (OpenAI Developers)
Regra 5 — tudo precisa ser mensurável
Sem telemetria, não existe case.

3. Arquitetura recomendada
3.1 Camadas
Camada A — Fonte de dados
Responsável por fornecer o dado real.
Entradas:
estoque da Attra;
páginas individuais dos veículos;
dados de contato/comercial;
CRM ou endpoint de handoff.
Saída:
payload bruto do veículo.
Camada B — Normalização
Responsável por transformar anúncio em objeto utilizável.
Campos mínimos:
vehicle_id
brand
model
version
year_model
price
mileage_km
fuel_type
transmission
body_type
armored
color
store_unit
available
vehicle_url
image_urls
Campos enriquecidos:
usage_profile
positioning_profile
price_band
exclusivity_score
daily_use_score
executive_presence_score
family_fit_score
patrimony_profile
Camada C — MCP Server
Essa é a peça obrigatória da arquitetura do app no ChatGPT. O Apps SDK usa MCP como base para manter servidor, modelo e UI sincronizados. (OpenAI Developers)
Responsabilidades:
registrar tools;
validar parâmetros;
consultar base;
devolver JSON estruturado;
registrar recursos de UI;
controlar autenticação e segurança;
emitir logs.
Camada D — UI embutida
A UI roda em iframe no ChatGPT e continua compatível com window.openai/runtime do Apps SDK. (OpenAI Developers)
Responsabilidades:
mostrar cards;
abrir detalhes;
renderizar comparação;
permitir CTA de continuidade;
exibir estado de loading/erro.
Camada E — Analytics
Responsável por rastrear:
busca iniciada;
resultado retornado;
clique em card;
abertura de detalhe;
comparação iniciada;
handoff criado;
origem ChatGPT;
resultado comercial posterior.

4. Stack sugerida
Você já opera bem com stack pragmática. Então não inventa.
Backend MCP
Node.js + TypeScript
framework web leve: Fastify ou Express
pacote MCP/Apps SDK oficial da OpenAI
schema validation com zod
Frontend UI
React + TypeScript
build leve com Vite
componentes próprios, sem exagero visual
foco em card, comparação, CTA
Dados
preferencialmente consumo da fonte oficial do estoque da Attra
cache intermediário em Postgres ou Supabase
Redis opcional para cache quente de consultas frequentes
Observabilidade
logs estruturados
Sentry ou equivalente
métricas por tool call
auditoria básica de handoff
Deploy
backend em domínio público com HTTPS
frontend UI em domínio separado ou subpath seguro
ambiente staging e production
A conexão do app ao ChatGPT para testes usa developer mode no ChatGPT; para produção pública, entra o fluxo de submissão/publicação. (OpenAI Developers)

5. Ferramentas do MVP
A OpenAI recomenda começar por ferramentas claras e úteis, com metadata forte. Não faça tool-coringa. (OpenAI Developers)
5.1 search_inventory
Finalidade: transformar intenção em lista de veículos.
Entradas:
query_text
brand
body_type
fuel_type
price_min
price_max
year_min
armored
usage_profile
positioning_profile
Saída:
lista de veículos com highlights e links
Regras:
nunca retornar veículo indisponível como principal opção;
se não houver match exato, retornar match aproximado com explicação;
limitar volume de retorno para não poluir a UI.
5.2 get_vehicle_details
Finalidade: abrir ficha detalhada.
Entradas:
vehicle_id
Saída:
specs;
narrativa comercial curta;
imagens;
CTA;
link oficial.
Regras:
sempre usar dados reais do veículo;
pode enriquecer com leitura comercial, mas sem inventar informação factual.
5.3 compare_vehicles
Finalidade: comparar 2 ou 3 carros no contexto do uso.
Entradas:
vehicle_ids
comparison_goal
Saída:
strengths;
tradeoffs;
recomendação.
Regras:
não fazer comparação puramente técnica;
comparar também por uso, imagem, praticidade e aderência ao objetivo.
5.4 start_consultant_handoff
Finalidade: criar a ponte para o comercial.
Entradas:
vehicle_id
interest_summary
preferred_store
contact_channel
user_name opcional
Saída:
status do handoff;
destino;
payload enviado;
mensagem de continuidade.
Regras:
criar registro com origem chatgpt_app;
anexar contexto da busca;
anexar veículos visualizados/comparados, se houver;
nunca depender só do texto final do usuário.
5.5 preview_purchase_path
Finalidade: mostrar caminhos comerciais possíveis.
Entradas:
vehicle_id
purchase_mode
budget_context
Saída:
próximos passos possíveis;
recomendação de continuidade.
Regras:
não prometer aprovação;
não calcular financiamento real no MVP;
não executar avaliação de troca.

6. Modelo de dados interno
6.1 Tabela vehicles_normalized
Campos recomendados:
id
external_stock_id
brand
model
version
title_public
year_manufacture
year_model
price
mileage_km
fuel_type
transmission
body_type
armored
color
horsepower_cv
store_unit
available
vehicle_url
main_image_url
image_urls_json
updated_at
6.2 Tabela vehicle_profiles
vehicle_id
usage_profile
positioning_profile
exclusivity_score
daily_use_score
executive_presence_score
family_fit_score
patrimony_profile
notes_internal
6.3 Tabela chatgpt_sessions
session_id
created_at
user_channel
source_app_version
first_query
last_action
handoff_created
6.4 Tabela chatgpt_events
id
session_id
event_type
tool_name
payload_json
created_at
6.5 Tabela chatgpt_handoffs
id
session_id
vehicle_id
interest_summary
preferred_store
destination_channel
crm_status
seller_id
created_at

7. Fluxo de dados
7.1 Sync do estoque
Fluxo ideal:
fonte oficial da Attra publica ou expõe dados;
job de ingestão captura alterações;
normalizador transforma em objeto consistente;
tabela vehicles_normalized é atualizada;
cache é invalidado.
Frequência:
idealmente near real-time;
aceitável no MVP: a cada 5 ou 10 minutos, dependendo da fonte.
7.2 Consulta no app
usuário faz pergunta;
ChatGPT escolhe tool com base em metadata;
MCP server recebe chamada;
server consulta normalização/cache;
devolve JSON;
UI renderiza;
evento é logado.
7.3 Handoff comercial
usuário pede continuidade;
tool start_consultant_handoff consolida contexto;
backend cria registro de handoff;
envia payload para CRM/WhatsApp;
retorna confirmação ao app;
loga evento e status.

8. Prompting e inteligência de camada intermediária
Você não deve jogar tudo no modelo bruto.
Precisa de uma camada de interpretação controlada.
8.1 O que o modelo faz
interpretar intenção textual;
sugerir filtros;
produzir narrativa curta;
apoiar comparação consultiva.
8.2 O que o modelo não deve fazer
inventar disponibilidade;
inventar preço;
inventar versão;
decidir regra de roteamento crítico sem fallback;
resumir mal dados vindos da base.
8.3 Estratégia prática
Crie uma função intermediária de “intent parser” que converta frases em filtros estruturados.
Exemplo:
“quero um Porsche para usar no dia a dia até 900 mil”
vira:
{
  "brand": "Porsche",
  "price_max": 900000,
  "usage_profile": "uso_diario",
  "positioning_profile": "premium_equilibrado"
}
Essa camada pode usar modelo, mas o resultado precisa ser validado por schema antes de chegar na query.

9. Metadata das tools
A OpenAI é explícita: metadata ruim piora descoberta e aumenta chamadas erradas; metadata boa melhora recall e precisão. (OpenAI Developers)
Então cada tool precisa ter:
nome simples e humano;
descrição objetiva do que faz;
quando usar;
parâmetros descritos com clareza;
exemplos de uso reais.
Exemplo ruim:
findCars
Exemplo melhor:
search_inventory
Descrição boa:
“Busca veículos disponíveis da Attra com base em intenção, faixa de preço, tipo de carro e perfil de uso.”
Descrição ruim:
“Ferramenta incrível para achar carros.”
Isso parece detalhe. Não é.
Isso afeta se o ChatGPT vai usar sua tool na conversa certa. (OpenAI Developers)

10. UI do app
10.1 Componentes mínimos
SearchResultsGrid
VehicleCard
VehicleDetailPanel
ComparisonPanel
HandoffPanel
EmptyState
ErrorState
10.2 Regras de UX
máximo de 6 cards por busca inicial;
comparação de até 3 veículos;
CTA claro;
nada de visual infantil ou cheio de ornamento;
resposta rápida e legível.
10.3 Estados obrigatórios
loading;
resultado vazio;
erro de consulta;
veículo indisponível;
handoff concluído;
handoff falhou.

11. Segurança e governança
11.1 Segurança de dados
O servidor MCP é quem controla autenticação, metadados e entrega de dados. Essa responsabilidade é do backend, não do modelo. (OpenAI Developers)
Então:
sanitize todos os inputs;
valide com schema;
faça rate limiting;
registre logs;
evite expor endpoints internos;
se houver dados sensíveis no handoff, trate com política clara.
11.2 Guardrails
Bloqueios mínimos:
evitar promessas comerciais não suportadas;
evitar afirmações sobre financiamento sem base;
evitar informações de veículos já indisponíveis;
evitar comparações difamatórias a concorrentes.
11.3 Publicação
Para publicar no diretório, a OpenAI exige submissão, revisão, e depois publicação no dashboard; também pede materiais como nome, descrição, política de privacidade e outros itens da submissão. (OpenAI Developers)

12. Ambientes
Você precisa de 3 ambientes.
Dev
tool testing rápido;
mock de estoque;
UI local;
túnel HTTPS temporário se necessário.
Staging
integração quase real;
estoque controlado;
handoff para sandbox;
testes dentro do ChatGPT via developer mode. (OpenAI Developers)
Production
domínio final;
telemetria ativa;
handoff real;
política de rollout.

13. Checklist de execução por squad
13.1 Produto
definir escopo exato do MVP;
definir casos de uso prioritários;
escrever matriz de intenção do usuário;
definir KPIs.
13.2 Engenharia backend
subir MCP server;
implementar tools;
integrar fonte de estoque;
criar normalização;
criar handoff;
registrar eventos.
13.3 Engenharia frontend
criar UI embutida;
implementar cards, detalhe, comparação e handoff;
tratar estados de erro;
garantir performance.
13.4 Dados
taxonomia de perfis;
scorecards por veículo;
política de atualização;
consistência dos campos.
13.5 Comercial/Operação
definir dono da origem ChatGPT;
padronizar resposta;
definir SLA;
registrar resultado no CRM.

14. Roadmap técnico de 12 semanas
Semanas 1–2
mapear fonte do estoque;
modelar tabelas;
desenhar taxonomia;
definir tools e schemas.
Semanas 3–4
subir MCP server;
implementar search_inventory;
implementar get_vehicle_details;
criar UI básica de cards.
Semanas 5–6
implementar normalização enriquecida;
implementar compare_vehicles;
melhorar metadata das tools;
iniciar analytics.
Semanas 7–8
implementar start_consultant_handoff;
integrar CRM/WhatsApp;
criar sessão e eventos;
tratar erros e fallback.
Semanas 9–10
implementar preview_purchase_path;
endurecer segurança;
refinar UX;
testar no ChatGPT com developer mode. (OpenAI Developers)
Semanas 11–12
preparar submissão;
revisar policy/privacy;
coletar screenshots;
validar telemetria e estabilidade. (OpenAI Developers)

15. Critérios de pronto
O MVP só está pronto se cumprir estes critérios:
Funcionais
busca retorna veículos reais;
detalhe abre corretamente;
comparação funciona;
handoff cria registro real;
UI não quebra em vazio/erro.
Técnicos
logs por tool call;
schema validation em todas as entradas;
cache funcionando;
telemetria mínima ativa;
ambiente staging testado no ChatGPT.
Comerciais
origem ChatGPT identificável;
payload chega com contexto;
time sabe tratar esse lead.

16. O que não fazer
não comece pelo visual;
não comece pelo nome bonito;
não monte tool genérica demais;
não deixe o modelo inventar regra comercial;
não acople o app diretamente a HTML do site sem camada de normalização;
não lance sem owner comercial do handoff;
não tente publicar antes de ter uso interno consistente.

17. Resultado esperado do primeiro ciclo
Ao final do primeiro ciclo, vocês precisam ter:
um app funcional no ChatGPT conectado ao estoque da Attra;
uma experiência útil de descoberta e comparação;
handoff comercial real;
telemetria de uso;
base para transformar isso em case.
Esse é o guia certo. O resto é distração.
Se quiser, eu transformo isso agora em um runbook técnico operacional, com:
backlog por sprint,
definição de endpoints,
exemplo de schemas das tools,
e estrutura inicial de pastas para backend MCP + frontend UI.
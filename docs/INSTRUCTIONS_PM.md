# Instruções para o PM — Cadastro do Attra Concierge na OpenAI

Este guia cobre o processo manual necessário para publicar o Attra Concierge como um GPT com Actions na plataforma da OpenAI.

---

## Pré-requisitos

- Conta OpenAI com acesso ao ChatGPT Plus ou Team
- Servidor de produção já no ar em `https://concierge.attraveiculos.com.br`
- Confirmar com o dev que o endpoint `/health` retorna `200` antes de iniciar

---

## Parte 1 — Criar o GPT no ChatGPT Builder

1. Acesse [chatgpt.com](https://chatgpt.com) e clique em **Explorar GPTs** no menu lateral
2. Clique em **Criar** (canto superior direito)
3. Preencha os campos básicos:
   - **Nome**: `Attra Concierge`
   - **Descrição**: `Especialista em veículos premium. Busca, compara e orienta na jornada de compra com base no estoque real da Attra Veículos.`
   - **Foto de perfil**: usar a identidade visual da Attra

4. Na aba **Configurar**, cole o conteúdo do arquivo `apps/server/gpt-instructions.md` no campo **Instruções**

---

## Parte 2 — Configurar a Action (integração com o servidor)

1. Na aba **Configurar**, clique em **Criar nova action**
2. Em **Esquema**, selecione **Importar de URL** e cole:
   ```
   https://concierge.attraveiculos.com.br/openapi.yaml
   ```
3. O Builder vai carregar as 5 tools automaticamente:
   - `searchVehicles`
   - `getVehicleDetails`
   - `compareVehicles`
   - `previewPurchasePath`
   - `startConsultantHandoff`

4. Em **Autenticação**, selecione **OAuth**:
   - **Tipo**: OAuth
   - **Client ID**: deixar em branco por enquanto (será preenchido após gerar)
   - **Client Secret**: deixar em branco por enquanto
   - **URL de Autorização**: `https://concierge.attraveiculos.com.br/oauth/authorize`
   - **URL do Token**: `https://concierge.attraveiculos.com.br/oauth/token`
   - **Escopo**: `read`
   - **Tipo de Token**: Bearer

5. Clique em **Salvar** — o Builder vai gerar e exibir:
   - Um **Client ID** (exemplo: `chatgpt-action-xxxxx`)
   - Uma **URL de Callback** (exemplo: `https://chatgpt.com/connector/oauth/ohId_xxxxx`)

6. **Anote esses dois valores** e passe para o desenvolvedor:
   - `OAUTH_CLIENT_ID` = o Client ID gerado
   - `OAUTH_REDIRECT_URI` = a URL de Callback gerada

7. Aguarde o dev reiniciar o servidor com essas variáveis configuradas (normalmente leva menos de 5 minutos)

8. Volte ao Builder, preencha o **Client ID** no campo correspondente e salve novamente

---

## Parte 3 — Configurar a Política de Privacidade

1. Ainda na aba **Configurar**, localize o campo **URL da Política de Privacidade**
2. Cole:
   ```
   https://concierge.attraveiculos.com.br/privacidade
   ```
3. Essa página é gerada automaticamente pelo servidor — não precisa de hospedagem externa

---

## Parte 4 — Testar antes de publicar

1. Clique em **Visualizar** (preview) no canto superior direito
2. Faça as seguintes perguntas para validar:
   - `Quais SUVs vocês têm disponíveis?` — deve retornar veículos reais do estoque
   - `Me mostra os detalhes do [nome de um veículo que apareceu]` — deve trazer ficha completa
   - `Quero falar com um consultor` — deve acionar o handoff e confirmar envio

3. Se alguma tool retornar erro de autenticação, confirme com o dev que as vars `OAUTH_CLIENT_ID` e `OAUTH_REDIRECT_URI` foram aplicadas e o servidor reiniciado

---

## Parte 5 — Publicar

1. Clique em **Salvar** e depois em **Publicar**
2. Selecione a visibilidade desejada:
   - **Apenas eu** — para testes internos
   - **Qualquer pessoa com o link** — para compartilhamento controlado
   - **GPT Store** — para publicação pública (requer revisão da OpenAI)
3. Para submeter à GPT Store, preencha as categorias e aguarde o processo de revisão da OpenAI (normalmente 1 a 5 dias úteis)

---

## Referências rápidas

| Item | Valor |
|---|---|
| URL do servidor | `https://concierge.attraveiculos.com.br` |
| OpenAPI spec | `https://concierge.attraveiculos.com.br/openapi.yaml` |
| Autorização OAuth | `https://concierge.attraveiculos.com.br/oauth/authorize` |
| Token OAuth | `https://concierge.attraveiculos.com.br/oauth/token` |
| Política de privacidade | `https://concierge.attraveiculos.com.br/privacidade` |
| Health check | `https://concierge.attraveiculos.com.br/health` |


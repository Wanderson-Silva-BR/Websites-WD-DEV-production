# WD DEV Secure Platform

Reformulação full-stack isolada de seis projetos:

- Marcell Celular
- Marlon Tech
- PH STORE
- Belshi Studio
- Ivan Mazzaropi
- WD DEV

Cada pasta em `apps/` é uma aplicação independente com Worker, banco D1, mídia R2, segredos e implantação próprios.

## O que foi removido

- Senhas e usuários em `localStorage`.
- Credenciais administrativas escritas em HTML ou JavaScript.
- Sessões controladas pelo cliente.
- Autorização baseada apenas em esconder componentes.
- Inserção de dados do usuário com `innerHTML`.
- Painéis que alteravam somente o navegador e pareciam produção.

## Controles implementados

Consulte `docs/SECURITY.md`. A base inclui autenticação no servidor, PBKDF2 com salt e pepper, cookies protegidos, CSRF, rate limiting, bloqueio de conta, RBAC, validação, SQL parametrizado, auditoria e cabeçalhos rígidos.

## Implantação de cada projeto

O guia completo está em `docs/CLOUDFLARE-PASSO-A-PASSO.md`.

1. Entre na pasta correspondente em `apps/`.
2. Execute `npm install` e `npm run typecheck`.
3. Crie um D1 e substitua `REPLACE_AFTER_D1_CREATE` pelo ID real.
4. Crie o bucket R2 indicado no `wrangler.toml`.
5. Defina `PASSWORD_PEPPER` e `IP_HASH_KEY` usando `wrangler secret put`.
6. Execute `npm run db:remote`.
7. Gere o SQL do primeiro administrador com `npm run admin:sql`, passando as variáveis apenas no terminal, e aplique-o ao D1. O nome inicial padrão é `WD_DEV`; a senha nunca é gravada no projeto.
8. Execute `npm run deploy`.

Nunca reutilize peppers, bancos, buckets ou credenciais entre os seis clientes.

## Hospedagem recomendada

### 1. Cloudflare Workers + D1 + R2

É a plataforma-alvo deste pacote. Possui plano gratuito para testes, backend edge, banco SQL e armazenamento de imagens. Para produção, use plano pago, backups exportados, domínio próprio e alertas.

### 2. Supabase + frontend compatível

Boa alternativa quando a prioridade for PostgreSQL, Auth gerenciado e Row Level Security. O plano gratuito permite somente dois projetos gratuitos por conta; portanto, não comporta seis clientes isolados sem contas ou planos adicionais.

### 3. Render

Útil para testar Node.js tradicional e PostgreSQL. Serviços gratuitos dormem quando inativos e bancos Postgres gratuitos expiram; não é adequado como hospedagem permanente dos clientes.

### 4. Railway

Conveniente para testes rápidos com Docker/Node/PostgreSQL, mas funciona por créditos. Quando o crédito acaba, o serviço pausa.

## Observação

“Difícil de quebrar” não significa invulnerável. Produção exige atualização contínua, backups restaurados em teste, monitoramento, revisão de permissões, resposta a incidentes e auditorias periódicas.

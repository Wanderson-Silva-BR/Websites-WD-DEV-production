# WD DEV Security Baseline v1

Esta base substitui qualquer autenticação em `localStorage` ou credencial escrita no JavaScript.

## Controles obrigatórios

- Banco D1 e bucket R2 exclusivos para cada cliente.
- Senhas derivadas no servidor com PBKDF2-SHA-256, salt aleatório, pepper secreto e 310 mil iterações.
- Sessões aleatórias armazenadas somente como hash no banco.
- Cookies `HttpOnly`, `Secure`, `SameSite=Strict` e expiração curta.
- CSRF por token duplo, validação de origem e comparação segura.
- Bloqueio temporário após cinco falhas e rate limiting por IP anonimizado.
- Autorização no backend para `client`, `editor` e `admin`.
- Consultas parametrizadas; nenhuma concatenação de SQL.
- Validação de tamanho, tipo, formato e intervalo.
- CSP, HSTS, `nosniff`, bloqueio de iframe e política de permissões.
- Auditoria de login, logout, alterações administrativas e contatos.
- Soft-delete de produtos e separação de privilégios administrativos.

## Segredos

Nunca entram no Git, ZIP, HTML ou JavaScript:

- `PASSWORD_PEPPER`
- `IP_HASH_KEY`
- credenciais administrativas
- tokens de implantação

Configure-os com `wrangler secret put`.

## Limites

Nenhum sistema é “inquebrável”. A meta é defesa em profundidade, impacto limitado, rastreabilidade, atualizações e resposta rápida. Produção exige backups testados, domínio próprio, monitoramento, revisão de dependências e plano de incidentes.

# Publicação no Cloudflare — WD DEV

Este procedimento deve ser repetido dentro da pasta de cada projeto em `apps/`. Cada site possui Worker, D1, R2 e segredos próprios.

## 1. Preparar a conta

1. Crie ou acesse uma conta em `dash.cloudflare.com`.
2. Instale o Node.js LTS no computador.
3. Abra o terminal na pasta do projeto escolhido.
4. Execute `npm install`.
5. Execute `npx wrangler login` e autorize o navegador.

Confirme a conta ativa com `npx wrangler whoami`.

## 2. Criar banco D1

Consulte o `database_name` do `wrangler.toml` e execute:

```bash
npx wrangler d1 create NOME_DO_BANCO
```

O comando retornará um `database_id`. Copie somente esse ID e substitua `REPLACE_AFTER_D1_CREATE` no `wrangler.toml` do projeto atual.

Depois aplique o banco:

```bash
npm run db:remote
```

## 3. Criar armazenamento R2

Consulte o `bucket_name` do `wrangler.toml` e execute:

```bash
npx wrangler r2 bucket create NOME_DO_BUCKET
```

O nome deve ser exatamente o mesmo do arquivo. Se o painel solicitar ativação do R2, conclua a ativação antes de repetir o comando.

## 4. Configurar segredos

Gere dois valores aleatórios diferentes para cada projeto. Não os envie por mensagem e não os coloque em arquivos.

```bash
npx wrangler secret put PASSWORD_PEPPER
npx wrangler secret put IP_HASH_KEY
```

O terminal pedirá cada valor de forma protegida. Use valores longos, aleatórios e exclusivos. Guarde-os em um gerenciador de senhas.

## 5. Criar o superusuário

O gerador lê os dados somente das variáveis do terminal e produz um hash. O usuário padrão é `WD_DEV`. Informe um e-mail administrativo válido e a senha provisória no ambiente local; não edite o script para inseri-los.

Execute `npm run admin:sql` com as variáveis `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `PASSWORD_PEPPER` definidas somente na sessão atual do terminal. Salve a saída como um arquivo SQL temporário, aplique com:

```bash
npx wrangler d1 execute DB --remote --file=CAMINHO_DO_SQL
```

Apague o SQL temporário depois da aplicação. Ele contém apenas o hash, mas não deve ser arquivado. No primeiro login, o painel exigirá a troca da senha antes de liberar qualquer operação administrativa.

## 6. Validar e publicar

```bash
npm run typecheck
npm test
npm run deploy
```

Ao finalizar, o Wrangler mostrará um endereço `workers.dev`. Acesse `/admin.html` nesse endereço para realizar o primeiro login.

## 7. Configurar domínio posteriormente

No painel Cloudflare, abra **Workers & Pages**, selecione o Worker e use **Settings > Domains & Routes > Add > Custom Domain**. Faça isso apenas quando o domínio definitivo estiver sob a conta correta.

## Checklist por projeto

- D1 exclusivo criado e migração aplicada.
- R2 exclusivo criado.
- `database_id` real inserido apenas no projeto correto.
- `PASSWORD_PEPPER` e `IP_HASH_KEY` exclusivos.
- Superusuário `WD_DEV` criado sem senha em arquivos.
- Senha provisória trocada no primeiro login.
- `npm run typecheck` e `npm test` aprovados.
- URL `workers.dev` e painel administrativo testados.

## Ordem sugerida

Comece pelo Ivan Mazzaropi como piloto. Depois publique WD DEV, Belshi Studio, PH STORE, Marlon Tech e Marcell Celular. Assim, qualquer ajuste operacional identificado no primeiro teste pode ser replicado antes das demais publicações.

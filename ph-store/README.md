# PH STORE — Protótipo Netlify

Site estático demonstrativo da PH STORE, preparado para publicação direta na Netlify.

## Publicar na Netlify

### Opção 1 — arrastar e soltar
1. Compacte ou use a pasta inteira do projeto.
2. Acesse o painel da Netlify.
3. Em **Add new site > Deploy manually**, arraste a pasta (ou o ZIP descompactado, conforme a interface pedir).
4. Não há comando de build: o `index.html` está na raiz.

### Opção 2 — GitHub
1. Suba esta pasta para um repositório.
2. Conecte o repositório à Netlify.
3. Build command: deixe vazio.
4. Publish directory: `.`

## Recursos já incluídos
- layout responsivo desktop/mobile
- Motion.js com animações suaves
- catálogo com filtros e busca
- carrinho local
- finalização demonstrativa pelo WhatsApp
- área de atacado
- banner e preferências de cookies
- modal de privacidade/LGPD
- newsletter demonstrativa
- headers básicos de segurança via `netlify.toml`

## Próximas integrações recomendadas para produção
- painel administrativo e banco de dados
- autenticação de clientes
- estoque real
- checkout/pagamentos
- Correios/transportadora
- política de privacidade revisada conforme os tratamentos reais
- analytics somente após consentimento

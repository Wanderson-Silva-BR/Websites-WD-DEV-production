# Marlon Tech — Netlify Demo V1

Conceito premium de e-commerce para eletrônicos novos e seminovos.

## Publicação no Netlify
1. Extraia o ZIP.
2. No Netlify, use **Add new site > Deploy manually**.
3. Arraste a pasta `marlon-tech-netlify` ou o conteúdo dela.
4. Não há comando de build nesta versão.

## O que funciona na demo
- Catálogo dinâmico com busca e filtros.
- Produtos novos e seminovos.
- Carrinho persistente no navegador.
- Cadastro e login demonstrativos com hash local de senha.
- Consulta de CEP via ViaCEP e cálculo demonstrativo de frete.
- Painel administrativo demonstrativo para cadastrar, editar e excluir produtos e controlar estoque.
- Alterações do Admin aparecem no catálogo no mesmo navegador.
- Motion.js carregado por ESM com fallback e suporte a `prefers-reduced-motion`.
- Banner de consentimento, preferências de cookies, Política de Privacidade e Política de Cookies.

## Admin demo
- E-mail: `admin@marlontech.demo`
- Senha: `Demo2026!`

## Importante para produção
Esta versão é um protótipo funcional front-end. Para uma loja real, substituir:
- Autenticação local por backend seguro (Supabase/Firebase/Auth0/backend próprio).
- Estoque em localStorage por banco de dados com transações.
- Frete demonstrativo por API real de Correios/Melhor Envio/transportadora.
- Checkout demonstrativo por gateway de pagamento e antifraude.
- Políticas LGPD pelos textos aprovados de acordo com a operação real.
- Credenciais de Admin demo por RBAC/autenticação server-side.

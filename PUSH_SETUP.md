# 🚀 INSS Memória NASA — Push real no iPhone (sem OneSignal)

## O que é possível
O iPhone 16.4+ aceita Web Push em Home Screen web apps. O NASA usa PWA + Service Worker + Push API. O servidor é somente o entregador; a lógica de estudo permanece no app.

## O que você precisa fazer uma única vez
1. Criar uma conta gratuita no Cloudflare.
2. Criar um Workers KV namespace chamado `NASA_KV`.
3. Copiar o ID desse namespace para `push-server/wrangler.jsonc`.
4. Gerar uma chave VAPID (não coloque a chave privada no GitHub).
5. Configurar no Worker os secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`.
6. Publicar o Worker e copiar a URL dele.
7. No NASA, salvar a URL do Worker e a chave pública VAPID.
8. Publicar o PWA em HTTPS e adicionar à Tela de Início do iPhone.
9. Abrir o NASA pelo ícone da Tela de Início e tocar em “Ativar notificações”.
10. Tocar em “Enviar teste” e bloquear a tela do iPhone.

## VAPID
Use `npx web-push-neo generate-vapid-keys` ou outra ferramenta compatível. Guarde a PRIVATE KEY somente no segredo do servidor. A chave pública vai para o app.

## Custo
Cloudflare Workers possui plano Free. A documentação atual informa 100.000 requisições/dia e KV gratuito dentro dos limites do plano. Para uso pessoal do NASA, isso é muito mais que suficiente.

## Importante
GitHub Pages sozinho não executa o servidor de Push. O PWA pode continuar hospedado no GitHub Pages, mas o pequeno endpoint de Push precisa rodar em um serviço de Worker/servidor. Isso não é OneSignal e não exige Apple Developer Program para Web Push.

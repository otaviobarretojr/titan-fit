# PWA

O TITAN FIT usa `vite-plugin-pwa` em modo de atualização por confirmação (`prompt`).

## Escopo

- Base, `start_url` e `scope`: `/titan-fit/`.
- O shell é armazenado para abertura offline após a primeira visita.
- Recursos externos não são incluídos em cache de execução.
- O prefixo de cache é exclusivo do TITAN FIT.

## Atualização

Quando houver uma nova versão, o aplicativo exibe **Nova versão disponível** com as ações **Atualizar agora** e **Depois**. A atualização não deve interromper um treino silenciosamente.

## Instalação

O banner de instalação aparece apenas quando o navegador fornece o evento `beforeinstallprompt`. A tela Mais também expõe a ação quando disponível.

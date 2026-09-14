# BetLock BR v2.2.0 — BET Shield + AdBlock

Atualização da linha Campus Beta. Mantém `applicationId com.wddev.betlock`, o bloqueio local por `VpnService`/DNS e adiciona um AdBlock separável para apps e jogos.

## v2.2
- BET Shield sempre ativo enquanto a VPN estiver ligada; não há allowlist de apostas no app.
- AdBlock opcional e ligado por padrão, útil para bloquear anúncios/tracking em apps e jogos.
- AdBlock pode ser pausado para anúncios recompensados sem desligar a proteção contra apostas.
- Contadores separados de consultas de BETs e anúncios bloqueadas (hoje e total).
- Progressão local por horas de proteção: +10 XP/h e +100 XP por 24h acumuladas.
- Atualização automática das listas a cada 12 h e atualização manual.
- HaGeZi Gambling Mini e Pro Mini, StevenBlack e BetBlocker.
- Sem AccessibilityService, leitura de tela ou captura de imagens.
- Sem root. O tráfego de usuário não passa por servidor próprio do projeto.

## Limitação técnica
Bloqueio DNS não consegue remover todos os anúncios. Se publicidade e conteúdo do app usam o mesmo domínio, bloquear esse domínio pode quebrar funções. O AdBlock pode ser pausado nesses casos.

## Build
Java 17, Android Gradle Plugin 8.7.3, Gradle 8.10.2, compile/target SDK 35, min SDK 26.

**Wanderson — BICT — projeto acadêmico e experimental.**

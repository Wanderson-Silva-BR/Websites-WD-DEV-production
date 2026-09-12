# BetLock BR — Campus Beta

O **BetLock BR** é um projeto independente de prevenção e redução de danos relacionados a apostas online. A ideia nasceu de uma experiência pessoal real com apostas e da vontade de transformar essa experiência em uma ferramenta útil para outras pessoas.

## Sobre a iniciativa

**Idealizador:** Wanderson — **2º Período — BICT**

Este projeto é uma iniciativa pessoal de caráter acadêmico e experimental, sem vinculação institucional com a WD DEV.

Posiciono-me de forma crítica e contrária à normalização das apostas online e aos impactos financeiros e sociais que elas podem causar. O objetivo do BetLock BR não é incentivar curiosidade sobre plataformas de apostas, mas criar uma barreira prática para ajudar pessoas a se manterem afastadas delas.

> **Recomendação:** não aposte, não crie conta e não deposite qualquer valor para testar o aplicativo. Casas de apostas são estruturadas para operar com vantagem matemática sobre o jogador; participar financeiramente não é necessário para contribuir com este projeto.

## A matemática por trás da vantagem da casa

A vantagem da casa não significa que **ninguém consegue ganhar uma aposta**. Significa que, quando as probabilidades e os pagamentos são estruturados com margem, o **valor esperado** de uma sequência grande de apostas tende a favorecer a operadora.

### 1. Valor esperado

Para uma aposta com probabilidade `p` de vitória, odd decimal `d` e aposta de R$ 1, o retorno líquido esperado pode ser escrito como:

```text
EV = p × d - 1
```

Se `EV < 0`, a aposta possui expectativa matemática negativa para o jogador.

Exemplo: suponha um evento realmente 50/50 oferecido a odd `1,90`.

```text
p = 0,50
d = 1,90

EV = 0,50 × 1,90 - 1
EV = 0,95 - 1
EV = -0,05
```

Resultado: **-5% por unidade apostada, em expectativa**.

Uma aposta de R$ 10 tem perda esperada de R$ 0,50. Em 100 apostas de R$ 10, o volume apostado é R$ 1.000 e a perda esperada é R$ 50.

Isso não significa que uma pessoa obrigatoriamente perderá R$ 50 depois de exatamente 100 apostas. Existe variância: ela pode estar ganhando ou perdendo muito mais naquele momento. O valor esperado descreve a tendência estatística de longo prazo.

### 2. Odds e a margem escondida — overround

A probabilidade implícita de uma odd decimal é:

```text
probabilidade implícita = 1 / odd
```

Em um mercado de dois resultados no qual ambos são oferecidos a `1,90`:

```text
1 / 1,90 = 0,526315...
52,63% + 52,63% = 105,26%
```

As probabilidades implícitas somam **105,26%**, e não 100%.

```text
overround = 105,26% - 100%
overround = 5,26%
```

Quando a margem é distribuída proporcionalmente, a margem normalizada correspondente é:

```text
margem = 1 - (1 / 1,0526316)
margem ≈ 5,00%
```

É por isso que, no exemplo 50/50, apostar repetidamente a `1,90` produz valor esperado de aproximadamente **-5%** para o jogador.

Para empatar matematicamente a longo prazo em odd `1,90`, o jogador teria de acertar:

```text
1 / 1,90 = 52,63%
```

Ou seja: **52,63% de acerto apenas para chegar ao ponto de equilíbrio**, antes de considerar erros de estimativa, mudanças de linha, limitações e outros fatores.

### 3. Odd 1,80 em um evento 50/50

Se dois lados igualmente prováveis forem oferecidos a `1,80`:

```text
1 / 1,80 = 55,56%
55,56% + 55,56% = 111,11%
```

Overround:

```text
111,11% - 100% = 11,11%
```

Para um evento realmente 50/50:

```text
EV = 0,50 × 1,80 - 1
EV = -0,10
```

**Expectativa: -10% do valor apostado.**

R$ 10 apostados 1.000 vezes representam R$ 10.000 de giro. Nesse modelo, a perda esperada seria:

```text
R$ 10.000 × 10% = R$ 1.000
```

### 4. Apostas múltiplas acumulam a margem

Considere quatro eventos independentes, cada um realmente 50/50, mas oferecido a odd `1,90`.

Probabilidade real de acertar os quatro:

```text
0,5⁴ = 0,0625 = 6,25%
```

Odd acumulada oferecida:

```text
1,90⁴ = 13,0321
```

Valor esperado:

```text
EV = 0,0625 × 13,0321 - 1
EV = 0,81450625 - 1
EV = -0,18549375
```

**Expectativa: aproximadamente -18,55%.**

O mesmo efeito pode ser visto por:

```text
0,95⁴ = 0,8145
1 - 0,8145 = 18,55%
```

Com oito seleções equivalentes:

```text
0,95⁸ ≈ 0,6634
perda esperada ≈ 33,66%
```

Este exemplo é didático e supõe eventos independentes 50/50, todos precificados a `1,90`. Mercados reais têm probabilidades, margens e correlações diferentes, mas a ideia permanece: **margens negativas podem se acumular em múltiplas**.

### 5. RTP em cassino e slots

`RTP` significa **Return to Player** — retorno teórico ao jogador ao longo de um grande número de partidas.

Se um jogo possui RTP de `96%`:

```text
vantagem da casa = 100% - 96%
vantagem da casa = 4%
```

Se o jogador gerar R$ 10.000 de volume total apostado:

```text
retorno teórico = R$ 10.000 × 0,96 = R$ 9.600
perda esperada = R$ 10.000 - R$ 9.600 = R$ 400
```

O RTP **não promete devolver 96% em uma sessão específica**. É uma média teórica obtida ao longo de um número muito grande de jogadas. A UK Gambling Commission também destaca que o volume de apostas (`turnover`) inclui valores ganhos e posteriormente apostados novamente.

### 6. Roleta: um exemplo em que a vantagem é visível

Na roleta de zero único existem 37 resultados: números `1–36` mais o `0`. Em uma aposta de R$ 1 no vermelho existem 18 resultados vencedores e 19 resultados perdedores.

```text
EV = (18/37 × R$ 1) + (19/37 × -R$ 1)
EV = (18 - 19) / 37
EV = -1/37
EV ≈ -2,7027%
```

A vantagem da casa é aproximadamente **2,70%**.

Na roleta com `0` e `00`, existem 38 resultados. Uma aposta simples em vermelho continua tendo 18 vencedores, mas passa a ter 20 perdedores:

```text
EV = (18/38 × 1) + (20/38 × -1)
EV = -2/38
EV ≈ -5,2632%
```

A vantagem sobe para aproximadamente **5,26%**.

### 7. Por que alguém pode ganhar e ainda assim a matemática favorecer a casa?

Voltemos ao exemplo de 100 apostas independentes, cada uma de R$ 10, com evento realmente 50/50 e odd `1,90`.

Cada vitória gera lucro líquido de R$ 9; cada derrota perde R$ 10. Para terminar as 100 apostas com lucro, seriam necessárias pelo menos 53 vitórias.

Mesmo existindo expectativa de perda de R$ 50, a probabilidade matemática de obter 53 ou mais vitórias em 100 tentativas 50/50 é de aproximadamente **30,86%**.

Ou seja: uma sequência inicial lucrativa **não demonstra que a margem deixou de existir**. Ela é perfeitamente compatível com um jogo de expectativa negativa.

Se o mesmo modelo for repetido por 1.000 apostas, seriam necessárias pelo menos 527 vitórias para terminar positivo. A probabilidade de isso ocorrer em um processo realmente 50/50 cai para aproximadamente **4,68%**.

Esse é um dos motivos pelos quais resultados de curto prazo podem criar uma percepção enganosa de habilidade ou controle.

### 8. Sistemas de aposta não removem a vantagem matemática

Martingale, dobrar após perder, aumentar a stake depois de vitórias ou alterar a ordem das apostas muda a **distribuição e o tamanho dos riscos**, mas não transforma automaticamente uma aposta de valor esperado negativo em positivo.

Pela linearidade da expectativa, quando uma sequência de apostas mantém a mesma vantagem da casa:

```text
perda esperada ≈ vantagem da casa × volume total apostado
```

Aumentar o volume apostado aumenta, em expectativa, o valor absoluto transferido para a vantagem da casa.

### Resumo rápido

| Situação didática | Vantagem / perda esperada |
|---|---:|
| Evento 50/50 a odd 1,90 | 5,00% do valor apostado |
| Evento 50/50 a odd 1,80 | 10,00% do valor apostado |
| Múltipla de 4 pernas 50/50 a 1,90 cada | 18,55% |
| Múltipla de 8 pernas 50/50 a 1,90 cada | 33,66% |
| Jogo com RTP 96% | 4,00% |
| Roleta com um zero | 2,70% |
| Roleta com zero e duplo zero | 5,26% |

> **Importante:** estes exemplos não afirmam que todas as casas, esportes ou jogos usam exatamente as mesmas margens. Odds, RTP, regras e margens variam. Os cálculos mostram os mecanismos matemáticos usados para transformar pequenas diferenças de pagamento em vantagem estatística de longo prazo.

### Fontes e leitura

- UK Gambling Commission — Return to Player e house edge: https://www.gamblingcommission.gov.uk/public-and-players/guide/return-to-player-how-much-gaming-machines-payout
- UK Gambling Commission — cálculo do RTP: https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/how-to-calculate-return-to-player-rtp
- UK Gambling Commission — conceitos de RTP, volatilidade e turnover: https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/key-terms-relating-to-live-return-to-player-performance-monitoring-of-games
- UK Gambling Commission — regras exigem informação sobre house edge, margin ou over-round: https://www.gamblingcommission.gov.uk/report/raising-standards-for-consumers-compliance-and-enforcement-report-2020-to/rts-3-rules-game-descriptions-and-the-likelihood-of-winning
- Wizard of Odds — matemática da roleta de zero único e duplo zero: https://wizardofodds.com/games/roulette/basics/

## Teste universitário

A versão recomendada para testes é a **v2.1 Campus Beta**. O objetivo deste piloto é descobrir:

- sites de apostas que ainda conseguem escapar do bloqueio;
- falsos positivos em sites legítimos;
- dificuldades de instalação e ativação da VPN;
- problemas de desempenho e compatibilidade;
- melhorias de interface e progressão.

**Importante:** ninguém precisa apostar dinheiro para testar. O teste consiste apenas em verificar se páginas públicas conhecidas de apostas são bloqueadas. **Não faça depósitos, cadastros ou apostas para participar do piloto.**

## Downloads

Os APKs serão mantidos nesta pasta do GitHub:

- `BetLockBR-v2.1.0-campus.apk` — versão recomendada
- `BetLockBR-v1.0.0-debug.apk` — versão legada para comparação técnica

> A v2.1 Campus Beta não usa serviço de acessibilidade, não lê a tela e não captura imagens. O bloqueio é realizado pela VPN/DNS local e pelas listas de domínios.

## Feedback

Depois de testar, envie suas impressões pelo formulário:

https://tally.so/r/VLKVva

O formulário pode ser respondido sem identificação. Não envie senhas, informações bancárias ou outros dados sensíveis.

## Quero colaborar

Desenvolvedores, estudantes, pessoas de segurança, design, UX, pesquisa e interessados em prevenção podem pedir para participar do projeto abrindo uma issue com o título **“Quero colaborar com o BetLock BR”**:

https://github.com/Wanderson-Silva-BR/Websites-WD-DEV-production/issues/new?title=Quero%20colaborar%20com%20o%20BetLock%20BR

Explique brevemente em que área gostaria de ajudar. Não é necessário ter experiência profissional.

## Estado do projeto

O BetLock BR ainda é experimental. Ele não deve ser apresentado como tratamento médico ou garantia absoluta contra apostas. O objetivo é adicionar uma barreira técnica e ferramentas de autocontrole que possam complementar outras formas de apoio.

## Próximos passos

A linha futura prevê atualização comunitária de domínios, backend Cloudflare, proteção contra domínios rotativos/mirrors, melhoria das listas, progressão gamificada e endurecimento de segurança.

---

**Wanderson — 2º Período — BICT**

Projeto acadêmico e experimental de iniciativa pessoal.

// EconomyTooltipText — textos dos tooltips de economia (bilingue BR/EN)
// Centralizados aqui pra nao duplicar em cada jogo ou no admin

export interface TooltipEntry {
  title: string;
  text: string;
}

export const ECONOMY_TOOLTIPS = {
  br: {
    multiplier_global: {
      title: "Multiplicador de Economia",
      text: "Esse numero multiplica TODOS os valores do casino. Os numeros que aparecem na roda, nas tabelas de pagamento e nos premios sao valores BASE. O servidor aplica o multiplicador pra ajustar a economia. Formula sugerida: salario medio por hora do servidor dividido por 10.000.",
    } as TooltipEntry,
    multiplier_override: {
      title: "Override por Jogo",
      text: "Se preenchido, este jogo usa esse multiplicador ao inves do global. Deixe vazio pra usar o multiplicador global. Util pra tornar um jogo especifico mais ou menos generoso.",
    } as TooltipEntry,
    base_value: {
      title: "Valor BASE",
      text: "Esse eh o numero fixo que aparece no visual do jogo (na roda, na tabela, etc). Ele eh multiplicado pelo multiplicador do servidor pra gerar o valor real que o jogador recebe.",
    } as TooltipEntry,
    mystery: {
      title: "Mystery — Surpresa",
      text: "Quando o jogador cai no segmento '?', ele ganha um valor aleatorio entre o minimo e maximo BASE configurados. Esse valor tambem eh multiplicado pelo multiplicador.",
    } as TooltipEntry,
    milestones_curve: {
      title: "Recompensas de Sequencia",
      text: "A cada 7 dias consecutivos jogando, o jogador ganha um BONUS extra alem da roda diaria. Os valores sao BASE (multiplicados pelo multiplicador). Se o jogador perder 1 dia, perde a sequencia (cria habito de logar todo dia).",
    } as TooltipEntry,
    reference_table: {
      title: "Tabela de Referencia",
      text: "Use essa tabela pra encontrar o multiplicador ideal pro seu servidor. Servidores com salarios altos precisam de multiplicadores maiores pra que os premios sejam relevantes. Servidores com salarios baixos precisam de multiplicadores menores pra nao quebrar a economia.",
    } as TooltipEntry,
    currency_config: {
      title: "Configuracao da Moeda",
      text: "Defina o nome, simbolo e icone da moeda do seu servidor. Essa moeda aparece em todos os jogos do casino. Nao existe conversao R$ — a moeda do casino eh a moeda inteira do servidor.",
    } as TooltipEntry,
  },
  en: {
    multiplier_global: {
      title: "Economy Multiplier",
      text: "This number multiplies ALL casino values. Numbers shown on wheels, paytables and prizes are BASE values. The server applies the multiplier to adjust economy. Suggested formula: average hourly salary divided by 10,000.",
    } as TooltipEntry,
    multiplier_override: {
      title: "Per-Game Override",
      text: "If set, this game uses this multiplier instead of the global one. Leave empty to use the global multiplier. Useful to make a specific game more or less generous.",
    } as TooltipEntry,
    base_value: {
      title: "BASE Value",
      text: "This is the fixed number shown on the game visual (wheel, table, etc). It is multiplied by the server multiplier to generate the actual value the player receives.",
    } as TooltipEntry,
    mystery: {
      title: "Mystery — Surprise",
      text: "When the player lands on the '?' segment, they win a random amount between the configured BASE minimum and maximum. This value is also multiplied by the multiplier.",
    } as TooltipEntry,
    milestones_curve: {
      title: "Streak Rewards",
      text: "Every 7 consecutive days playing, the player earns a BONUS on top of the daily spin. Values are BASE (multiplied by multiplier). If the player misses 1 day, the streak resets (creates daily login habit).",
    } as TooltipEntry,
    reference_table: {
      title: "Reference Table",
      text: "Use this table to find the ideal multiplier for your server. High-salary servers need higher multipliers so prizes feel relevant. Low-salary servers need lower multipliers to avoid breaking the economy.",
    } as TooltipEntry,
    currency_config: {
      title: "Currency Configuration",
      text: "Set the name, symbol and icon of your server's currency. This currency appears in all casino games. There is no R$ conversion — the casino currency is the server's full currency.",
    } as TooltipEntry,
  },
} as const;

export type TooltipKey = keyof typeof ECONOMY_TOOLTIPS.br;

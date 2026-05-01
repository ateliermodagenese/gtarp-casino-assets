"use client";

// Secoes do HelpGameModal pre-configuradas para o Daily-Free (#19)
// Cada jogo do casino tera seu proprio arquivo deste tipo
//
// Como integrar no DailyFreeGame.tsx:
//
//   import { HelpGameModal } from "@/components/shared";
//   import { DAILY_FREE_HELP_SECTIONS } from "./DailyFreeHelpSections";
//
//   const [showHelp, setShowHelp] = useState(false);
//
//   <HelpGameModal
//     open={showHelp}
//     onClose={() => setShowHelp(false)}
//     lang={lang}
//     gameTitle={lang === "br" ? "Bonus Diario" : "Daily Free"}
//     gameLogo="/assets/games/daily-free/logo-mini.png"
//     sections={DAILY_FREE_HELP_SECTIONS}
//     escId="daily-free-help"
//     escPush={escPush}
//     escPop={escPop}
//   />

import { HelpCard, type HelpSection } from "@/components/shared";

export const DAILY_FREE_HELP_SECTIONS: HelpSection[] = [
  // ============================================================
  // ABA 1 — COMO FUNCIONA
  // ============================================================
  {
    id: "como-funciona",
    icon: "/assets/games/daily-free/logo-mini.png",
    titleBR: "Como Funciona",
    titleIN: "How It Works",
    content: (lang) => (
      <>
        <HelpCard
          icon="/assets/games/daily-free/icons/wheel-pointer.png"
          title={lang === "br" ? "1. Gire a Roleta Diaria" : "1. Spin the Daily Wheel"}
        >
          {lang === "br"
            ? "Toda dia voce tem direito a 1 giro gratis na Roleta da Sorte. Clique em GIRAR e a roda decide o seu premio em GCoin."
            : "Every day you get 1 free spin on the Wheel of Fortune. Click SPIN and the wheel decides your GCoin prize."}
        </HelpCard>

        <HelpCard
          icon="/assets/games/daily-free/icons/icon-flame.png"
          title={lang === "br" ? "2. Mantenha o Streak" : "2. Keep Your Streak"}
        >
          {lang === "br"
            ? "Cada dia que voce gira a roleta aumenta seu Streak em +1. Volte todo dia para nao perder! Se ficar 1 dia sem girar, o streak zera (a menos que use um Token de Recuperacao)."
            : "Every day you spin adds +1 to your Streak. Come back daily to keep it! If you miss a day, the streak resets (unless you use a Make-Up Token)."}
        </HelpCard>

        <HelpCard
          icon="/assets/games/daily-free/icons/icon-trophy.png"
          title={lang === "br" ? "3. Ganhe Premios Especiais" : "3. Earn Special Rewards"}
        >
          {lang === "br"
            ? "Aos 7, 14, 21 e 28 dias de streak voce desbloqueia premios bonus em cima do giro normal. Quanto maior o streak, melhor o premio."
            : "At 7, 14, 21 and 28 days of streak you unlock bonus prizes on top of the normal spin. Longer streak, better prize."}
        </HelpCard>
      </>
    ),
  },

  // ============================================================
  // ABA 2 — PREMIOS DA ROLETA
  // ============================================================
  {
    id: "premios",
    icon: "/assets/games/daily-free/prizes/coin-stack.png",
    titleBR: "Premios da Roleta",
    titleIN: "Wheel Rewards",
    content: (lang) => (
      <>
        <HelpCard
          icon="/assets/games/daily-free/prizes/coin-small.png"
          title={lang === "br" ? "Comum: 50-100 GC" : "Common: 50-100 GC"}
        >
          {lang === "br"
            ? "A maioria dos segmentos. Ganhar moedas todo dia mantem voce ativo."
            : "Most of the segments. Daily coins keep you active."}
        </HelpCard>

        <HelpCard
          icon="/assets/games/daily-free/prizes/coin-medium.png"
          title={lang === "br" ? "Bom: 200-500 GC" : "Good: 200-500 GC"}
        >
          {lang === "br"
            ? "Premios medios. Cerca de 30% de chance."
            : "Mid-tier prizes. About 30% chance."}
        </HelpCard>

        <HelpCard
          icon="/assets/games/daily-free/prizes/coin-stack.png"
          title={lang === "br" ? "Grande: 1000 GC" : "Big: 1000 GC"}
          variant="win"
        >
          {lang === "br"
            ? "Pilha de moedas! Cerca de 8% de chance."
            : "Coin stack! Around 8% chance."}
        </HelpCard>

        <HelpCard
          icon="/assets/games/daily-free/prizes/treasure.png"
          title={lang === "br" ? "MYSTERY: ate 5000 GC" : "MYSTERY: up to 5000 GC"}
          variant="win"
        >
          {lang === "br"
            ? "Segmento especial! Bau aleatorio de 1000 a 5000 GC. So 4% de chance — o jackpot diario!"
            : "Special segment! Random chest from 1000 to 5000 GC. Just 4% chance — the daily jackpot!"}
        </HelpCard>
      </>
    ),
  },

  // ============================================================
  // ABA 3 — STREAK & MILESTONES
  // ============================================================
  {
    id: "streak",
    icon: "/assets/games/daily-free/icons/icon-flame.png",
    titleBR: "Streak & Milestones",
    titleIN: "Streak & Milestones",
    content: (lang) => (
      <>
        <HelpCard
          icon="/assets/games/daily-free/badges/badge-streak-7-BR.png"
          title={lang === "br" ? "7 dias: +500 GC" : "7 days: +500 GC"}
        >
          {lang === "br"
            ? "Primeira semana completa. Bonus de 500 GC alem do giro normal."
            : "First week complete. 500 GC bonus on top of the normal spin."}
        </HelpCard>

        <HelpCard
          icon="/assets/games/daily-free/badges/badge-streak-14-BR.png"
          title={lang === "br" ? "14 dias: +1.000 GC" : "14 days: +1,000 GC"}
        >
          {lang === "br"
            ? "Duas semanas. Bonus duplica para 1.000 GC."
            : "Two weeks. Bonus doubles to 1,000 GC."}
        </HelpCard>

        <HelpCard
          icon="/assets/games/daily-free/badges/badge-streak-21-BR.png"
          title={lang === "br" ? "21 dias: +2.500 GC" : "21 days: +2,500 GC"}
        >
          {lang === "br" ? "Tres semanas. Bonus de 2.500 GC." : "Three weeks. 2,500 GC bonus."}
        </HelpCard>

        <HelpCard
          icon="/assets/games/daily-free/badges/badge-streak-28-BR.png"
          title={lang === "br" ? "28 dias: +5.000 GC + Reset" : "28 days: +5,000 GC + Reset"}
          variant="win"
        >
          {lang === "br"
            ? "CICLO COMPLETO! 5.000 GC bonus, troféu mensal exclusivo, ciclo recomeca em D1 (mantendo o streak total)."
            : "FULL CYCLE! 5,000 GC bonus, exclusive monthly trophy, cycle restarts at D1 (keeping total streak)."}
        </HelpCard>
      </>
    ),
  },

  // ============================================================
  // ABA 4 — TOKENS DE RECUPERACAO
  // ============================================================
  {
    id: "makeup-tokens",
    icon: "/assets/games/daily-free/icons/icon-lock.png",
    titleBR: "Tokens de Recuperacao",
    titleIN: "Make-Up Tokens",
    content: (lang) => (
      <>
        <HelpCard
          title={lang === "br" ? "O que sao?" : "What are they?"}
          variant="tip"
        >
          {lang === "br"
            ? "Voce tem 3 Tokens de Recuperacao por mes. Cada token recupera 1 dia perdido sem zerar o streak."
            : "You have 3 Make-Up Tokens per month. Each token recovers 1 missed day without resetting your streak."}
        </HelpCard>

        <HelpCard
          title={lang === "br" ? "Como usar" : "How to use"}
        >
          {lang === "br"
            ? "Se esquecer 1 dia, ao voltar voce vera o botao 'Usar Token de Recuperacao'. Clique para gastar 1 token e manter o streak ativo."
            : "If you miss 1 day, when you return you'll see the 'Use Make-Up Token' button. Click to spend 1 token and keep your streak alive."}
        </HelpCard>

        <HelpCard
          title={lang === "br" ? "Reset mensal" : "Monthly reset"}
          variant="warning"
        >
          {lang === "br"
            ? "Os tokens nao acumulam. Todo dia 1 do mes voce recebe 3 tokens novos, os antigos sao apagados."
            : "Tokens don't stack. On the 1st of every month you get 3 fresh tokens, old ones are wiped."}
        </HelpCard>
      </>
    ),
  },

  // ============================================================
  // ABA 5 — PROVABLY FAIR
  // ============================================================
  {
    id: "provably-fair",
    icon: "/assets/shared/icons/icon-provably-fair.png",
    titleBR: "Justica Comprovavel",
    titleIN: "Provably Fair",
    content: (lang) => (
      <>
        <HelpCard
          title={lang === "br" ? "Sistema 100% auditavel" : "100% Auditable System"}
          variant="tip"
        >
          {lang === "br"
            ? "Todo giro usa criptografia HMAC-SHA256 (mesmo padrao do Stake.com). O resultado e calculado pelo servidor antes do giro acontecer — voce pode verificar matematicamente que nao foi manipulado."
            : "Every spin uses HMAC-SHA256 cryptography (same standard as Stake.com). The result is calculated by the server before the spin happens — you can mathematically verify nothing was tampered with."}
        </HelpCard>

        <HelpCard
          title={lang === "br" ? "Como verificar" : "How to verify"}
        >
          {lang === "br"
            ? "No Historico, clique em 'Verify' em qualquer giro. Voce vera as 3 chaves usadas (server seed, client seed, nonce) e pode confirmar o resultado em qualquer verificador HMAC-SHA256 da internet."
            : "In History, click 'Verify' on any spin. You'll see the 3 keys used (server seed, client seed, nonce) and can confirm the result in any online HMAC-SHA256 verifier."}
        </HelpCard>
      </>
    ),
  },
];

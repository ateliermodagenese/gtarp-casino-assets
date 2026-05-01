"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LuxuryTooltip from "@/components/shared/LuxuryTooltip";

type Screen = "login" | "setup" | "config";
type TabId = "currency" | "finance" | "texts" | "control" | "security";

interface ConfigRow {
  chave: string;
  valor: string;
  descricao: string | null;
}

const isFiveM =
  typeof window !== "undefined" &&
  window.location.href.includes("cfx-nui-");

const resourceName = "bc_casino";

const MOCK_MASTER = "blackout-casino-master-2026";
const mockAdmin = {
  masterPassword: MOCK_MASTER,
  adminPassword: null as string | null,
  setupComplete: false,
  failedAttempts: 0,
  configs: {} as Record<string, string>,
};

function mockAdminHandler(evento: string, payload: any): any {
  const ep = evento.replace("casino:admin:", "");

  if (ep === "auth") {
    const pwd = payload?.password;
    const target = mockAdmin.setupComplete ? mockAdmin.adminPassword : mockAdmin.masterPassword;
    if (pwd === target) {
      mockAdmin.failedAttempts = 0;
      return { autenticado: true, token: "mock-token-web", setupComplete: mockAdmin.setupComplete };
    }
    mockAdmin.failedAttempts++;
    if (mockAdmin.failedAttempts >= 5) return { autenticado: false, bloqueado: true, mensagem: "Bloqueado por 300s" };
    return { autenticado: false, mensagem: `Senha incorreta (${mockAdmin.failedAttempts}/5)` };
  }

  if (ep === "setup") {
    if (payload?.newPassword && payload.newPassword.length >= 6) {
      mockAdmin.adminPassword = payload.newPassword;
      mockAdmin.masterPassword = null;
      mockAdmin.setupComplete = true;
      return { sucesso: true, mensagem: "Senha criada com sucesso!" };
    }
    return { sucesso: false, mensagem: "Senha deve ter no minimo 6 caracteres" };
  }

  if (ep === "getConfig") {
    return {
      sucesso: true,
      configs: Object.entries(mockAdmin.configs).map(([chave, valor]) => ({ chave, valor, descricao: "" })),
    };
  }

  if (ep === "setConfig") {
    const changes = payload?.changes || {};
    Object.assign(mockAdmin.configs, changes);
    return { sucesso: true, mensagem: `${Object.keys(changes).length} configuracoes salvas`, count: Object.keys(changes).length };
  }

  if (ep === "changePassword") {
    if (payload?.currentPassword !== mockAdmin.adminPassword) return { sucesso: false, mensagem: "Senha atual incorreta" };
    if (!payload?.newPassword || payload.newPassword.length < 6) return { sucesso: false, mensagem: "Nova senha deve ter no minimo 6 caracteres" };
    mockAdmin.adminPassword = payload.newPassword;
    return { sucesso: true, mensagem: "Senha alterada com sucesso!" };
  }

  return { sucesso: false, mensagem: "Endpoint desconhecido" };
}

async function fetchAdmin<T>(evento: string, payload?: unknown): Promise<T> {
  if (!isFiveM) {
    await new Promise((r) => setTimeout(r, 300));
    return mockAdminHandler(evento, payload) as T;
  }
  const resp = await fetch(`https://${resourceName}/${evento}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  return resp.json();
}

// ═══════════════════════════════════════════════
// PALETA CENTRALIZADA (hex puro, zero oklch, CEF Chrome 103)
// ═══════════════════════════════════════════════
const COR = {
  fundo: "rgba(12,10,5,0.99)",
  fundoGradiente: "linear-gradient(180deg, rgba(20,16,8,0.98) 0%, rgba(12,10,5,0.99) 100%)",
  secao: "rgba(255,255,255,0.025)",
  secaoBorda: "rgba(212,168,67,0.15)",
  goldPrimario: "#D4A843",
  goldClaro: "#FFD700",
  goldBorda: "rgba(212,168,67,0.25)",
  goldBordaAtiva: "rgba(212,168,67,0.45)",
  goldBordaFocus: "rgba(212,168,67,0.6)",
  goldGlow: "rgba(212,168,67,0.15)",
  goldGlowForte: "rgba(212,168,67,0.3)",
  goldTexto: "rgba(212,168,67,0.6)",
  goldTextoAtivo: "#FFD700",
  sucesso: "#00E676",
  erro: "#FF5252",
  txtSutil: "rgba(255,255,255,0.4)",
  overlay: "rgba(0,0,0,0.95)",
  inputBg: "rgba(0,0,0,0.4)",
  inputBorda: "rgba(212,168,67,0.2)",
};

// ═══════════════════════════════════════════════
// TABS DO ADMIN
// ═══════════════════════════════════════════════
const ADMIN_TABS: { id: TabId; labelBR: string; labelEN: string; icon: string }[] = [
  { id: "currency", labelBR: "MOEDA", labelEN: "CURRENCY", icon: "💰" },
  { id: "finance", labelBR: "FINANC.", labelEN: "FINANCE", icon: "📊" },
  { id: "texts", labelBR: "TEXTOS", labelEN: "TEXTS", icon: "📝" },
  { id: "control", labelBR: "CONTROLE", labelEN: "CONTROL", icon: "⚡" },
  { id: "security", labelBR: "SEGUR.", labelEN: "SECURITY", icon: "🔒" },
];

// ═══════════════════════════════════════════════
// SECOES DE CONFIGURACAO
// ═══════════════════════════════════════════════
const CONFIG_SECTIONS = [
  {
    id: "currency",
    fields: [
      { key: "currency_name", type: "text", tipBR: "Nome exibido no casino (ex: GCoin, Fichas)", tipEN: "Display name (e.g. GCoin, Chips)" },
      { key: "currency_symbol", type: "text", tipBR: "Abreviacao (ex: GC, FC)", tipEN: "Short symbol (e.g. GC, FC)" },
      { key: "currency_icon", type: "text", tipBR: "Caminho do icone da moeda", tipEN: "Currency icon path" },
      { key: "gcoin_rate", type: "number", tipBR: "Taxa: 1 moeda = $X dinheiro do jogo", tipEN: "Rate: 1 coin = $X game money" },
      { key: "currency_rate_label", type: "text", tipBR: "Texto de conversao exibido na ajuda", tipEN: "Conversion text shown in help" },
    ],
  },
  {
    id: "finance",
    fields: [
      { key: "min_deposit", type: "number", tipBR: "Deposito minimo permitido", tipEN: "Minimum deposit allowed" },
      { key: "max_deposit", type: "number", tipBR: "Deposito maximo por transacao", tipEN: "Max deposit per transaction" },
      { key: "min_withdraw", type: "number", tipBR: "Saque minimo permitido", tipEN: "Minimum withdrawal allowed" },
      { key: "max_withdraw", type: "number", tipBR: "Saque maximo por transacao", tipEN: "Max withdrawal per transaction" },
      { key: "deposit_fee_percent", type: "number", tipBR: "Taxa de deposito em % (0 = sem taxa)", tipEN: "Deposit fee % (0 = no fee)" },
      { key: "withdraw_tax_percent", type: "number", tipBR: "Taxa de saque em %", tipEN: "Withdrawal fee %" },
      { key: "daily_deposit_limit", type: "number", tipBR: "Limite diario de deposito", tipEN: "Daily deposit limit" },
      { key: "daily_withdraw_limit", type: "number", tipBR: "Limite diario de saque", tipEN: "Daily withdrawal limit" },
      { key: "cooldown_seconds", type: "number", tipBR: "Cooldown entre transacoes (segundos)", tipEN: "Cooldown between transactions (seconds)" },
    ],
  },
  {
    id: "texts",
    fields: [
      { key: "deposit_explanation_br", type: "textarea", tipBR: "Explicacao do deposito (PT-BR)", tipEN: "Deposit explanation (PT-BR)" },
      { key: "deposit_explanation_en", type: "textarea", tipBR: "Explicacao do deposito (EN)", tipEN: "Deposit explanation (EN)" },
      { key: "withdraw_explanation_br", type: "textarea", tipBR: "Explicacao do saque (PT-BR)", tipEN: "Withdrawal explanation (PT-BR)" },
      { key: "withdraw_explanation_en", type: "textarea", tipBR: "Explicacao do saque (EN)", tipEN: "Withdrawal explanation (EN)" },
      { key: "fee_explanation_br", type: "textarea", tipBR: "Texto sobre taxas (PT-BR). Use {withdraw_tax_percent} como placeholder", tipEN: "Fee text (PT-BR). Use {withdraw_tax_percent} as placeholder" },
      { key: "fee_explanation_en", type: "textarea", tipBR: "Texto sobre taxas (EN). Use {withdraw_tax_percent} como placeholder", tipEN: "Fee text (EN). Use {withdraw_tax_percent} as placeholder" },
      { key: "help_title_br", type: "text", tipBR: "Titulo do painel de ajuda (PT-BR)", tipEN: "Help panel title (PT-BR)" },
      { key: "help_title_en", type: "text", tipBR: "Titulo do painel de ajuda (EN)", tipEN: "Help panel title (EN)" },
    ],
  },
  {
    id: "control",
    fields: [
      { key: "casino_enabled", type: "toggle", tipBR: "Casino aberto (jogadores podem acessar)", tipEN: "Casino open (players can access)" },
      { key: "slot_enabled", type: "toggle", tipBR: "Slot Machine habilitado", tipEN: "Slot Machine enabled" },
    ],
  },
];

// ═══════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════
const labelStyle: React.CSSProperties = {
  fontFamily: "sans-serif",
  fontSize: "clamp(9px, 0.9vw, 11px)",
  color: COR.goldTexto,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "clamp(6px, 0.7vw, 10px) clamp(8px, 1vw, 12px)",
  borderRadius: 6,
  border: `1px solid ${COR.inputBorda}`,
  background: COR.inputBg,
  color: COR.goldClaro,
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 600,
  fontSize: "clamp(11px, 1.1vw, 13px)",
  outline: "none",
  transition: "border-color 0.25s, box-shadow 0.25s",
};

const textareaBaseStyle: React.CSSProperties = {
  ...inputBaseStyle,
  fontFamily: "sans-serif",
  fontWeight: 400,
  resize: "vertical" as const,
  minHeight: 50,
  maxHeight: 120,
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: "clamp(10px, 1.2vw, 16px)",
  borderRadius: 8,
  border: `1.5px solid rgba(212,168,67,0.4)`,
  background: "linear-gradient(135deg, rgba(212,168,67,0.2) 0%, rgba(212,168,67,0.08) 100%)",
  color: COR.goldClaro,
  fontFamily: "'Cinzel', serif",
  fontWeight: 700,
  fontSize: "clamp(11px, 1.2vw, 14px)",
  letterSpacing: "2px",
  cursor: "pointer",
  textShadow: "0 0 8px rgba(255,215,0,0.3)",
  transition: "all 0.25s",
};

// ═══════════════════════════════════════════════
// ANIMACOES
// ═══════════════════════════════════════════════
const screenVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

// ═══════════════════════════════════════════════
// HELPERS DE FOCUS (glow dourado premium)
// ═══════════════════════════════════════════════
function applyFocusGlow(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = COR.goldBordaFocus;
  e.target.style.boxShadow = `0 0 12px ${COR.goldGlow}, 0 0 4px ${COR.goldGlow}, inset 0 0 6px rgba(212,168,67,0.05)`;
}

function removeFocusGlow(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = COR.inputBorda;
  e.target.style.boxShadow = "none";
}

// ═══════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════
interface AdminPanelProps {
  onClose: () => void;
  lang: "br" | "in";
}

export default function AdminPanel({ onClose, lang }: AdminPanelProps) {
  const isBR = lang === "br";

  const [screen, setScreen] = useState<Screen>("login");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});

  const [showChangePass, setShowChangePass] = useState(false);
  const [curPass, setCurPass] = useState("");
  const [chgNewPass, setChgNewPass] = useState("");
  const [chgConfirm, setChgConfirm] = useState("");

  const [activeTab, setActiveTab] = useState<TabId>("currency");

  const dirty = Object.keys(edits).length > 0;

  const showMsg = useCallback((tipo: "ok" | "erro", texto: string) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  // ── LOGIN ──
  const handleLogin = useCallback(async () => {
    if (!password || loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetchAdmin<{
        autenticado: boolean;
        token?: string;
        setupComplete?: boolean;
        bloqueado?: boolean;
        mensagem?: string;
      }>("casino:admin:auth", { password });

      if (res.autenticado && res.token) {
        setToken(res.token);
        setPassword("");
        if (res.setupComplete) {
          setScreen("config");
          loadConfigs(res.token);
        } else {
          setScreen("setup");
        }
      } else {
        showMsg("erro", res.mensagem || (isBR ? "Senha incorreta" : "Wrong password"));
      }
    } catch {
      showMsg("erro", isBR ? "Erro de conexao" : "Connection error");
    }
    setLoading(false);
  }, [password, loading, isBR, showMsg]);

  // ── SETUP ──
  const handleSetup = useCallback(async () => {
    if (!newPass || loading) return;
    if (newPass.length < 6) {
      showMsg("erro", isBR ? "Minimo 6 caracteres" : "Minimum 6 characters");
      return;
    }
    if (newPass !== confirmPass) {
      showMsg("erro", isBR ? "Senhas nao coincidem" : "Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAdmin<{ sucesso: boolean; mensagem?: string }>(
        "casino:admin:setup",
        { token, newPassword: newPass }
      );
      if (res.sucesso) {
        showMsg("ok", isBR ? "Senha criada! Redirecionando..." : "Password created! Redirecting...");
        setTimeout(() => {
          setScreen("config");
          loadConfigs(token);
        }, 1500);
      } else {
        showMsg("erro", res.mensagem || "Erro");
      }
    } catch {
      showMsg("erro", isBR ? "Erro de conexao" : "Connection error");
    }
    setLoading(false);
  }, [newPass, confirmPass, token, loading, isBR, showMsg]);

  // ── LOAD CONFIGS ──
  const loadConfigs = useCallback(async (tkn: string) => {
    try {
      const res = await fetchAdmin<{ sucesso: boolean; configs?: ConfigRow[] }>(
        "casino:admin:getConfig",
        { token: tkn }
      );
      if (res.sucesso && res.configs) {
        const map: Record<string, string> = {};
        for (const row of res.configs) map[row.chave] = row.valor;
        setConfigs(map);
        setEdits({});
      }
    } catch { /* silent */ }
  }, []);

  // ── SAVE CONFIGS ──
  const handleSave = useCallback(async () => {
    if (!dirty || loading) return;
    setLoading(true);
    try {
      const res = await fetchAdmin<{ sucesso: boolean; mensagem?: string; count?: number }>(
        "casino:admin:setConfig",
        { token, changes: edits }
      );
      if (res.sucesso) {
        setConfigs((prev) => ({ ...prev, ...edits }));
        setEdits({});
        showMsg("ok", isBR ? `${res.count} configuracoes salvas!` : `${res.count} configs saved!`);
      } else {
        showMsg("erro", res.mensagem || "Erro");
      }
    } catch {
      showMsg("erro", isBR ? "Erro ao salvar" : "Save error");
    }
    setLoading(false);
  }, [dirty, loading, token, edits, isBR, showMsg]);

  // ── CHANGE PASSWORD ──
  const handleChangePass = useCallback(async () => {
    if (!curPass || !chgNewPass || loading) return;
    if (chgNewPass.length < 6) {
      showMsg("erro", isBR ? "Minimo 6 caracteres" : "Minimum 6 characters");
      return;
    }
    if (chgNewPass !== chgConfirm) {
      showMsg("erro", isBR ? "Senhas nao coincidem" : "Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAdmin<{ sucesso: boolean; mensagem?: string }>(
        "casino:admin:changePassword",
        { token, currentPassword: curPass, newPassword: chgNewPass }
      );
      if (res.sucesso) {
        showMsg("ok", isBR ? "Senha alterada!" : "Password changed!");
        setShowChangePass(false);
        setCurPass("");
        setChgNewPass("");
        setChgConfirm("");
      } else {
        showMsg("erro", res.mensagem || "Erro");
      }
    } catch {
      showMsg("erro", isBR ? "Erro de conexao" : "Connection error");
    }
    setLoading(false);
  }, [curPass, chgNewPass, chgConfirm, token, loading, isBR, showMsg]);

  // ── HELPERS ──
  const getVal = (key: string) => edits[key] ?? configs[key] ?? "";
  const setVal = (key: string, val: string) => {
    if (val === configs[key]) {
      setEdits((prev) => { const n = { ...prev }; delete n[key]; return n; });
    } else {
      setEdits((prev) => ({ ...prev, [key]: val }));
    }
  };
  const isEdited = (key: string) => key in edits;

  const tabHasEdits = (tabId: TabId): boolean => {
    if (tabId === "security") return false;
    const section = CONFIG_SECTIONS.find((s) => s.id === tabId);
    return section ? section.fields.some((f) => f.key in edits) : false;
  };

  // ── RENDER FIELD ──
  const renderField = (field: { key: string; type: string; tipBR: string; tipEN: string }) => {
    const tip = isBR ? field.tipBR : field.tipEN;
    const val = getVal(field.key);
    const edited = isEdited(field.key);
    const displayKey = field.key.replace(/_/g, " ");

    if (field.type === "toggle") {
      const isOn = val === "1" || val === "true";
      return (
        <div key={field.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <LuxuryTooltip text={tip} position="right" delay={300}>
            <span style={labelStyle}>
              {displayKey}
              {edited && <span style={{ color: COR.sucesso, fontSize: 8 }}>●</span>}
            </span>
          </LuxuryTooltip>
          <motion.button
            onClick={() => setVal(field.key, isOn ? "0" : "1")}
            whileTap={{ scale: 0.9 }}
            title={isOn ? (isBR ? "Desativar" : "Disable") : (isBR ? "Ativar" : "Enable")}
            style={{
              width: 42, height: 22, borderRadius: 11,
              background: isOn
                ? "linear-gradient(90deg, rgba(0,230,118,0.6), rgba(0,200,100,0.4))"
                : "rgba(60,60,60,0.6)",
              border: `1px solid ${isOn ? "rgba(0,230,118,0.4)" : "rgba(100,100,100,0.3)"}`,
              cursor: "pointer", position: "relative",
              transition: "all 0.25s",
              padding: 0,
            }}
          >
            <motion.div
              animate={{ x: isOn ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                width: 16, height: 16, borderRadius: "50%",
                background: isOn ? COR.sucesso : "rgba(150,150,150,0.8)",
                position: "absolute", top: 2,
                boxShadow: isOn ? "0 0 8px rgba(0,230,118,0.5)" : "none",
              }}
            />
          </motion.button>
        </div>
      );
    }

    const isTextarea = field.type === "textarea";
    const InputTag = isTextarea ? "textarea" : "input";

    return (
      <div key={field.key}>
        <LuxuryTooltip text={tip} position="right" delay={300}>
          <span style={labelStyle}>
            {displayKey}
            {edited && <span style={{ color: COR.sucesso, fontSize: 8, marginLeft: 4 }}>●</span>}
          </span>
        </LuxuryTooltip>
        <InputTag
          value={val}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setVal(field.key, e.target.value)}
          style={isTextarea ? textareaBaseStyle : inputBaseStyle}
          onFocus={applyFocusGlow}
          onBlur={removeFocusGlow}
        />
      </div>
    );
  };

  // ── FEEDBACK BAR ──
  const feedbackBar = msg && (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "8px 12px", borderRadius: 6,
        background: msg.tipo === "ok" ? "rgba(0,230,118,0.08)" : "rgba(255,82,82,0.08)",
        border: `1px solid ${msg.tipo === "ok" ? "rgba(0,230,118,0.2)" : "rgba(255,82,82,0.2)"}`,
        color: msg.tipo === "ok" ? COR.sucesso : COR.erro,
        fontSize: "clamp(9px, 0.9vw, 12px)", fontFamily: "sans-serif",
        flexShrink: 0,
      }}
    >
      {msg.tipo === "ok" ? "✓" : "✗"} {msg.texto}
    </motion.div>
  );

  // ── PASSWORD INPUT (reutilizavel) ──
  const passInput = (value: string, setValue: (v: string) => void, placeholder: string, onEnter?: () => void) => (
    <div style={{ position: "relative" as const, width: "100%" }}>
      <input
        type={showPass ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        style={{
          ...inputBaseStyle,
          textAlign: "center" as const,
          fontSize: "clamp(14px, 1.5vw, 18px)",
          letterSpacing: showPass ? "1px" : "3px",
          paddingRight: 36,
        }}
        onFocus={applyFocusGlow}
        onBlur={removeFocusGlow}
      />
      <button
        type="button"
        onClick={() => setShowPass(!showPass)}
        title={showPass ? (isBR ? "Ocultar senha" : "Hide password") : (isBR ? "Mostrar senha" : "Show password")}
        style={{
          position: "absolute" as const, right: 8, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: showPass ? COR.goldPrimario : "rgba(212,168,67,0.3)", fontSize: 14,
          padding: 4, lineHeight: 1, transition: "color 0.2s",
        }}
      >{showPass ? "◉" : "◎"}</button>
    </div>
  );

  // ── TAB CONTENT: secoes de config ──
  const renderTabContent = () => {
    if (activeTab === "security") {
      return (
        <motion.div
          key="security"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1vw, 12px)" }}
        >
          <motion.div variants={staggerItem}>
            {!showChangePass ? (
              <motion.button
                onClick={() => setShowChangePass(true)}
                whileHover={{ borderColor: COR.goldBordaAtiva, boxShadow: `0 0 15px ${COR.goldGlow}` }}
                whileTap={{ scale: 0.97 }}
                title={isBR ? "Alterar a senha de administrador" : "Change admin password"}
                style={{
                  ...btnStyle,
                  background: "rgba(255,255,255,0.02)",
                  fontSize: "clamp(9px, 1vw, 12px)",
                }}
              >
                {isBR ? "TROCAR SENHA" : "CHANGE PASSWORD"}
              </motion.button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}
                >
                  {passInput(curPass, setCurPass, isBR ? "Senha atual" : "Current password")}
                  {passInput(chgNewPass, setChgNewPass, isBR ? "Nova senha (min 6)" : "New password (min 6)")}
                  {passInput(chgConfirm, setChgConfirm, isBR ? "Confirmar nova" : "Confirm new", handleChangePass)}
                  <div style={{ display: "flex", gap: 8 }}>
                    <motion.button
                      onClick={handleChangePass}
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      title={isBR ? "Salvar nova senha" : "Save new password"}
                      style={{ ...btnStyle, flex: 1, fontSize: "clamp(9px, 1vw, 11px)" }}
                    >
                      {loading ? "..." : (isBR ? "SALVAR" : "SAVE")}
                    </motion.button>
                    <motion.button
                      onClick={() => { setShowChangePass(false); setCurPass(""); setChgNewPass(""); setChgConfirm(""); }}
                      whileTap={{ scale: 0.97 }}
                      title={isBR ? "Cancelar alteracao" : "Cancel change"}
                      style={{
                        ...btnStyle, flex: 1,
                        fontSize: "clamp(9px, 1vw, 11px)",
                        background: "rgba(255,82,82,0.08)",
                        borderColor: "rgba(255,82,82,0.3)",
                        color: "rgba(255,82,82,0.7)",
                        textShadow: "none",
                      }}
                    >
                      {isBR ? "CANCELAR" : "CANCEL"}
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>

          <motion.div variants={staggerItem}>
            <div style={{
              fontSize: "clamp(8px, 0.8vw, 10px)", fontFamily: "sans-serif",
              color: "rgba(212,168,67,0.3)", lineHeight: 1.5,
              padding: "clamp(8px, 1vw, 12px)",
              borderRadius: 6,
              background: "rgba(255,255,255,0.015)",
              border: `1px solid ${COR.secaoBorda}`,
            }}>
              {isBR
                ? "Recuperacao: acesse a tabela casino_admin_auth no banco de dados e apague admin_password."
                : "Recovery: access casino_admin_auth table in the database and clear admin_password."}
            </div>
          </motion.div>
        </motion.div>
      );
    }

    const section = CONFIG_SECTIONS.find((s) => s.id === activeTab);
    if (!section) return null;

    return (
      <motion.div
        key={activeTab}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1vw, 12px)" }}
      >
        {section.fields.map((field) => (
          <motion.div key={field.key} variants={staggerItem}>
            {renderField(field)}
          </motion.div>
        ))}
      </motion.div>
    );
  };

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 80,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: COR.overlay,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: screen === "config" ? "clamp(min(95%, 320px), 52vw, 640px)" : "clamp(min(90%, 280px), 32vw, 380px)",
          maxHeight: "92%",
          borderRadius: 16,
          border: `1.5px solid ${COR.goldBorda}`,
          background: COR.fundoGradiente,
          boxShadow: `0 0 60px ${COR.goldGlow}, 0 12px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(212,168,67,0.12)`,
          padding: "clamp(20px, 2.5vw, 32px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(10px, 1.3vw, 16px)",
          transition: "width 0.3s ease",
        }}
      >
        {/* ═══ HEADER (fixo) ═══ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{
            fontFamily: "'Cinzel', serif", fontWeight: 700,
            fontSize: "clamp(12px, 1.3vw, 16px)", color: COR.goldPrimario,
            letterSpacing: "2px",
          }}>
            {screen === "login"
              ? "ADMIN"
              : screen === "setup"
                ? (isBR ? "CONFIGURACAO INICIAL" : "INITIAL SETUP")
                : (isBR ? "PAINEL ADMIN" : "ADMIN PANEL")}
          </span>
          <LuxuryTooltip text={isBR ? "Fechar painel admin" : "Close admin panel"} position="left" delay={300}>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(212,168,67,0.5)", fontSize: "clamp(16px, 1.5vw, 20px)",
              }}
            >
              ✕
            </motion.button>
          </LuxuryTooltip>
        </div>

        {/* ═══ FEEDBACK ═══ */}
        <AnimatePresence>{feedbackBar}</AnimatePresence>

        {/* ═══ SCREEN TRANSITIONS ═══ */}
        <AnimatePresence mode="wait">
          {/* ─── LOGIN ─── */}
          {screen === "login" && (
            <motion.div
              key="screen-login"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.3vw, 16px)" }}
            >
              <div style={{
                textAlign: "center", fontSize: "clamp(9px, 0.9vw, 11px)",
                color: COR.txtSutil, fontFamily: "sans-serif",
              }}>
                {isBR ? "Painel administrativo — acesso restrito" : "Admin panel — restricted access"}
              </div>
              {passInput(password, setPassword, isBR ? "Senha" : "Password", handleLogin)}
              <motion.button
                onClick={handleLogin}
                disabled={!password || loading}
                whileHover={password ? { scale: 1.02, boxShadow: `0 0 25px ${COR.goldGlow}` } : {}}
                whileTap={password ? { scale: 0.98 } : {}}
                title={isBR ? "Autenticar no painel admin" : "Authenticate to admin panel"}
                style={{
                  ...btnStyle,
                  opacity: !password || loading ? 0.4 : 1,
                  cursor: !password || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <motion.svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <circle cx="12" cy="12" r="10" stroke={COR.goldClaro} strokeWidth="2.5" strokeDasharray="40 60" strokeLinecap="round" />
                    </motion.svg>
                  </span>
                ) : (isBR ? "ENTRAR" : "LOGIN")}
              </motion.button>
            </motion.div>
          )}

          {/* ─── SETUP ─── */}
          {screen === "setup" && (
            <motion.div
              key="screen-setup"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.3vw, 16px)" }}
            >
              <div style={{
                fontSize: "clamp(9px, 0.9vw, 11px)", fontFamily: "sans-serif",
                color: COR.txtSutil, lineHeight: 1.5, textAlign: "center",
              }}>
                {isBR
                  ? "Crie sua senha de administrador. A senha mestre sera desativada apos este passo."
                  : "Create your admin password. The master password will be deactivated after this step."}
              </div>
              {passInput(newPass, setNewPass, isBR ? "Nova senha (min 6)" : "New password (min 6)")}
              {passInput(confirmPass, setConfirmPass, isBR ? "Confirmar senha" : "Confirm password", handleSetup)}
              <motion.button
                onClick={handleSetup}
                disabled={!newPass || loading}
                whileHover={newPass ? { scale: 1.02, boxShadow: `0 0 25px ${COR.goldGlow}` } : {}}
                whileTap={newPass ? { scale: 0.98 } : {}}
                title={isBR ? "Criar senha de administrador" : "Create admin password"}
                style={{
                  ...btnStyle,
                  opacity: !newPass || loading ? 0.4 : 1,
                  cursor: !newPass || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <motion.svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <circle cx="12" cy="12" r="10" stroke={COR.goldClaro} strokeWidth="2.5" strokeDasharray="40 60" strokeLinecap="round" />
                    </motion.svg>
                  </span>
                ) : (isBR ? "CRIAR SENHA" : "CREATE PASSWORD")}
              </motion.button>
            </motion.div>
          )}

          {/* ─── CONFIG ─── */}
          {screen === "config" && (
            <motion.div
              key="screen-config"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                display: "flex", flexDirection: "column",
                flex: 1, minHeight: 0,
                gap: "clamp(10px, 1.3vw, 16px)",
              }}
            >
              {/* TAB BAR */}
              <div style={{
                display: "flex", gap: 0, borderRadius: 10,
                background: "rgba(255,255,255,0.03)", padding: 4,
                border: `1px solid ${COR.secaoBorda}`,
                flexShrink: 0,
              }}>
                {ADMIN_TABS.map((tab) => {
                  const ativo = activeTab === tab.id;
                  const temEdits = tabHasEdits(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      title={isBR ? tab.labelBR : tab.labelEN}
                      style={{
                        flex: 1, padding: "clamp(6px, 0.8vw, 10px) clamp(2px, 0.3vw, 6px)",
                        borderRadius: 8, border: "none", cursor: "pointer",
                        background: "transparent", position: "relative",
                        color: ativo ? COR.goldTextoAtivo : COR.goldTexto,
                        fontWeight: 700,
                        fontSize: "clamp(7px, 0.75vw, 10px)",
                        letterSpacing: "0.5px",
                        textShadow: ativo ? "0 0 8px rgba(255,215,0,0.4)" : "none",
                        transition: "color 0.2s, text-shadow 0.2s",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 2,
                      }}
                    >
                      {ativo && (
                        <motion.span
                          layoutId="adminActiveTab"
                          style={{
                            position: "absolute", inset: 0, borderRadius: 8,
                            background: "linear-gradient(135deg, rgba(212,168,67,0.18) 0%, rgba(212,168,67,0.06) 100%)",
                            border: `1px solid ${COR.goldBordaAtiva}`,
                            boxShadow: `0 0 12px ${COR.goldGlow}, inset 0 1px 0 rgba(255,215,0,0.08)`,
                            zIndex: -1,
                          }}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                      <span style={{ fontSize: "clamp(12px, 1.2vw, 16px)", lineHeight: 1 }}>{tab.icon}</span>
                      <span style={{ position: "relative" }}>
                        {isBR ? tab.labelBR : tab.labelEN}
                        {temEdits && (
                          <span style={{
                            position: "absolute", top: -2, right: -8,
                            width: 5, height: 5, borderRadius: "50%",
                            background: COR.sucesso,
                            boxShadow: "0 0 4px rgba(0,230,118,0.5)",
                          }} />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* SCROLLABLE CONTENT */}
              <div style={{
                flex: 1, minHeight: 0,
                overflowY: "auto",
                padding: "clamp(10px, 1.2vw, 16px)",
                borderRadius: 10,
                border: `1px solid ${COR.secaoBorda}`,
                background: COR.secao,
              }}>
                <AnimatePresence mode="wait">
                  {renderTabContent()}
                </AnimatePresence>
              </div>

              {/* SAVE BUTTON (fixo no rodape) */}
              <motion.button
                onClick={handleSave}
                disabled={!dirty || loading}
                animate={dirty ? {
                  boxShadow: [
                    `0 0 15px ${COR.goldGlow}`,
                    `0 0 30px ${COR.goldGlowForte}`,
                    `0 0 15px ${COR.goldGlow}`,
                  ],
                } : {}}
                transition={dirty ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                whileHover={dirty ? { scale: 1.02 } : {}}
                whileTap={dirty ? { scale: 0.98 } : {}}
                title={dirty
                  ? (isBR ? `Salvar ${Object.keys(edits).length} alteracoes` : `Save ${Object.keys(edits).length} changes`)
                  : (isBR ? "Nenhuma alteracao pendente" : "No pending changes")}
                style={{
                  ...btnStyle,
                  flexShrink: 0,
                  background: dirty
                    ? "linear-gradient(135deg, rgba(212,168,67,0.3) 0%, rgba(212,168,67,0.15) 50%, rgba(212,168,67,0.25) 100%)"
                    : "rgba(255,255,255,0.02)",
                  opacity: !dirty || loading ? 0.4 : 1,
                  cursor: !dirty || loading ? "not-allowed" : "pointer",
                  fontSize: "clamp(12px, 1.3vw, 15px)",
                  letterSpacing: "3px",
                }}
              >
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <motion.svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <circle cx="12" cy="12" r="10" stroke={COR.goldClaro} strokeWidth="2.5" strokeDasharray="40 60" strokeLinecap="round" />
                    </motion.svg>
                    {isBR ? "SALVANDO" : "SAVING"}
                  </span>
                ) : (isBR
                  ? `SALVAR${dirty ? ` (${Object.keys(edits).length})` : ""}`
                  : `SAVE${dirty ? ` (${Object.keys(edits).length})` : ""}`)}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

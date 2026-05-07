"use client";

/**
 * PanelRight.tsx
 *
 * EM PALAVRAS SIMPLES: painel da direita. Aparece propriedades do
 * elemento selecionado (X, Y, largura, altura, rotacao, etc).
 * Voce edita pelos inputs com setas precisas.
 *
 * TECNICAMENTE: orquestrador. Le selectedIds do store, mostra props
 * comuns + props especificas do tipo. Quando multi-select, mostra
 * "—" em campos com valores diferentes.
 */
import { useEditorStore } from "../state/editorStore";
import PropertyGroup from "./PropertyGroup";
import PrecisionInput from "./PrecisionInput";
import type {
  GameElement,
  ImageElement,
  RectElement,
  TextElement,
  PlaceholderElement,
} from "../state/schema";

export default function PanelRight() {
  const layout = useEditorStore((s) => s.layout);
  const currentSceneId = useEditorStore((s) => s.currentSceneId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const updateElement = useEditorStore((s) => s.updateElement);

  const scene = layout.scenes.find((s) => s.id === currentSceneId);
  const selected = (scene?.elements ?? []).filter((el) => selectedIds.includes(el.id));

  if (selected.length === 0) {
    return (
      <aside style={panelStyle}>
        <div style={emptyStyle}>
          <p style={emptyTextStyle}>
            <strong style={{ color: "#D4A843" }}>Nenhum elemento selecionado</strong>
            <br />
            <span style={{ fontSize: 11 }}>
              Click num elemento no canvas ou no painel esquerdo pra ver e editar suas propriedades.
            </span>
          </p>
        </div>
      </aside>
    );
  }

  // Helper: pega valor comum (igual em todos) ou retorna { mixed: true }
  const common = <K extends keyof GameElement>(key: K): GameElement[K] | undefined => {
    const first = selected[0][key];
    const allSame = selected.every((el) => el[key] === first);
    return allSame ? first : undefined;
  };

  const isMixed = <K extends keyof GameElement>(key: K): boolean => {
    const first = selected[0][key];
    return !selected.every((el) => el[key] === first);
  };

  // Patch aplicado em todos os selecionados
  const applyAll = (patch: Partial<GameElement>) => {
    selectedIds.forEach((id) => updateElement(id, patch));
  };

  // Tipo eh comum so se todos selecionados sao mesmo tipo
  const sharedType = selected.every((el) => el.type === selected[0].type) ? selected[0].type : null;

  return (
    <aside style={panelStyle}>
      <header style={headerStyle}>
        <div>
          <span style={titleStyle}>PROPRIEDADES</span>
          {selected.length > 1 && (
            <span style={multiBadgeStyle}>{selected.length} selecionados</span>
          )}
        </div>
      </header>

      <div style={scrollStyle}>
        {/* IDENTIFICACAO (so single-select) */}
        {selected.length === 1 && (
          <PropertyGroup title="Identificacao">
            <Field label="Nome">
              <input
                type="text"
                value={selected[0].name}
                onChange={(e) => updateElement(selected[0].id, { name: e.target.value })}
                style={textInputStyle}
              />
            </Field>
            <Field label="Tipo">
              <span style={readonlyStyle}>{selected[0].type}</span>
            </Field>
            <Field label="ID">
              <span style={{ ...readonlyStyle, fontSize: 10 }}>{selected[0].id.slice(0, 13)}…</span>
            </Field>
          </PropertyGroup>
        )}

        {/* POSICAO E TAMANHO */}
        <PropertyGroup title="Posicao e Tamanho">
          <div style={rowStyle}>
            <PrecisionInput
              label="X"
              suffix="%"
              value={(common("x") as number) ?? 0}
              mixed={isMixed("x")}
              onChange={(v) => applyAll({ x: v })}
              min={-100}
              max={200}
            />
            <PrecisionInput
              label="Y"
              suffix="%"
              value={(common("y") as number) ?? 0}
              mixed={isMixed("y")}
              onChange={(v) => applyAll({ y: v })}
              min={-100}
              max={200}
            />
          </div>
          <div style={rowStyle}>
            <PrecisionInput
              label="Largura"
              suffix="%"
              value={(common("width") as number) ?? 0}
              mixed={isMixed("width")}
              onChange={(v) => applyAll({ width: v })}
              min={0.1}
              max={200}
            />
            <PrecisionInput
              label="Altura"
              suffix="%"
              value={(common("height") as number) ?? 0}
              mixed={isMixed("height")}
              onChange={(v) => applyAll({ height: v })}
              min={0.1}
              max={200}
            />
          </div>
        </PropertyGroup>

        {/* TRANSFORM */}
        <PropertyGroup title="Transform">
          <PrecisionInput
            label="Rotacao"
            suffix="°"
            value={(common("rotation") as number) ?? 0}
            mixed={isMixed("rotation")}
            onChange={(v) => applyAll({ rotation: v })}
            step={1}
            shiftStep={15}
            ctrlStep={0.1}
            min={-360}
            max={360}
            decimals={2}
          />
          <PrecisionInput
            label="Opacidade"
            value={(common("opacity") as number) ?? 1}
            mixed={isMixed("opacity")}
            onChange={(v) => applyAll({ opacity: v })}
            step={0.05}
            shiftStep={0.1}
            ctrlStep={0.01}
            min={0}
            max={1}
            decimals={2}
          />
          <PrecisionInput
            label="z-Index"
            value={(common("zIndex") as number) ?? 0}
            mixed={isMixed("zIndex")}
            onChange={(v) => applyAll({ zIndex: Math.round(v) })}
            step={1}
            shiftStep={5}
            ctrlStep={1}
            decimals={0}
          />
        </PropertyGroup>

        {/* COMPORTAMENTO */}
        <PropertyGroup title="Comportamento" defaultOpen={false}>
          <Field label="Travado">
            <input
              type="checkbox"
              checked={(common("locked") as boolean) ?? false}
              onChange={(e) => applyAll({ locked: e.target.checked })}
            />
          </Field>
          <Field label="Visivel">
            <input
              type="checkbox"
              checked={(common("visible") as boolean) ?? true}
              onChange={(e) => applyAll({ visible: e.target.checked })}
            />
          </Field>
          <Field label="Ancora">
            <select
              value={(common("anchor") as string) ?? "topLeft"}
              onChange={(e) => applyAll({ anchor: e.target.value as never })}
              style={selectStyle}
            >
              <option value="topLeft">Topo-Esq</option>
              <option value="topCenter">Topo-Centro</option>
              <option value="topRight">Topo-Dir</option>
              <option value="middleLeft">Meio-Esq</option>
              <option value="center">Centro</option>
              <option value="middleRight">Meio-Dir</option>
              <option value="bottomLeft">Base-Esq</option>
              <option value="bottomCenter">Base-Centro</option>
              <option value="bottomRight">Base-Dir</option>
            </select>
          </Field>
        </PropertyGroup>

        {/* PROPRIEDADES POR TIPO (so mostra se todos do mesmo tipo) */}
        {sharedType === "rect" && <RectProps elements={selected as RectElement[]} update={updateElement} />}
        {sharedType === "text" && <TextProps elements={selected as TextElement[]} update={updateElement} />}
        {sharedType === "image" && <ImageProps elements={selected as ImageElement[]} update={updateElement} />}
        {sharedType === "placeholder" && (
          <PlaceholderProps elements={selected as PlaceholderElement[]} update={updateElement} />
        )}
      </div>

      <footer style={footerStyle}>
        Setas: ±0.1 · Shift+seta: ±1 · Ctrl+seta: ±0.01
      </footer>
    </aside>
  );
}

// =================================================================
// PROPS POR TIPO
// =================================================================

function RectProps({
  elements,
  update,
}: {
  elements: RectElement[];
  update: (id: string, patch: Partial<RectElement>) => void;
}) {
  const first = elements[0];
  const apply = (patch: Partial<RectElement>) => elements.forEach((e) => update(e.id, patch));

  return (
    <PropertyGroup title="Retangulo">
      <Field label="Cor de fundo">
        <input
          type="color"
          value={first.fill}
          onChange={(e) => apply({ fill: e.target.value })}
          style={colorInputStyle}
        />
      </Field>
      <Field label="Borda (cor)">
        <input
          type="color"
          value={first.stroke ?? "#000000"}
          onChange={(e) => apply({ stroke: e.target.value })}
          style={colorInputStyle}
        />
      </Field>
      <PrecisionInput
        label="Borda (largura)"
        value={first.strokeWidth ?? 0}
        onChange={(v) => apply({ strokeWidth: v })}
        step={0.5}
        shiftStep={2}
        ctrlStep={0.1}
        min={0}
        max={50}
      />
      <PrecisionInput
        label="Cantos arredondados"
        value={first.cornerRadius ?? 0}
        onChange={(v) => apply({ cornerRadius: v })}
        step={1}
        shiftStep={5}
        ctrlStep={0.5}
        min={0}
        max={100}
      />
    </PropertyGroup>
  );
}

function TextProps({
  elements,
  update,
}: {
  elements: TextElement[];
  update: (id: string, patch: Partial<TextElement>) => void;
}) {
  const first = elements[0];
  const apply = (patch: Partial<TextElement>) => elements.forEach((e) => update(e.id, patch));

  return (
    <PropertyGroup title="Texto">
      <Field label="Texto">
        <input
          type="text"
          value={first.text}
          onChange={(e) => apply({ text: e.target.value })}
          style={textInputStyle}
        />
      </Field>
      <Field label="Binding (runtime)">
        <input
          type="text"
          placeholder="{{credito}}"
          value={first.binding ?? ""}
          onChange={(e) => apply({ binding: e.target.value || undefined })}
          style={textInputStyle}
        />
      </Field>
      <Field label="Cor">
        <input
          type="color"
          value={first.color}
          onChange={(e) => apply({ color: e.target.value })}
          style={colorInputStyle}
        />
      </Field>
      <PrecisionInput
        label="Tamanho"
        suffix="%"
        value={first.fontSize}
        onChange={(v) => apply({ fontSize: v })}
        step={0.2}
        shiftStep={1}
        ctrlStep={0.05}
        min={0.5}
        max={50}
      />
      <Field label="Alinhamento">
        <select
          value={first.align}
          onChange={(e) => apply({ align: e.target.value as TextElement["align"] })}
          style={selectStyle}
        >
          <option value="left">Esquerda</option>
          <option value="center">Centro</option>
          <option value="right">Direita</option>
        </select>
      </Field>
      <Field label="Peso">
        <select
          value={first.fontWeight ?? 400}
          onChange={(e) => apply({ fontWeight: Number(e.target.value) as TextElement["fontWeight"] })}
          style={selectStyle}
        >
          <option value={400}>Normal (400)</option>
          <option value={500}>Medium (500)</option>
          <option value={600}>SemiBold (600)</option>
          <option value={700}>Bold (700)</option>
          <option value={900}>Black (900)</option>
        </select>
      </Field>
    </PropertyGroup>
  );
}

function ImageProps({
  elements,
  update,
}: {
  elements: ImageElement[];
  update: (id: string, patch: Partial<ImageElement>) => void;
}) {
  const first = elements[0];
  const apply = (patch: Partial<ImageElement>) => elements.forEach((e) => update(e.id, patch));

  return (
    <PropertyGroup title="Imagem">
      <Field label="Caminho (src)">
        <input
          type="text"
          value={first.src}
          onChange={(e) => apply({ src: e.target.value })}
          style={textInputStyle}
          placeholder="/assets/..."
        />
      </Field>
      <Field label="Encaixe">
        <select
          value={first.fit ?? "fill"}
          onChange={(e) => apply({ fit: e.target.value as ImageElement["fit"] })}
          style={selectStyle}
        >
          <option value="fill">Esticar</option>
          <option value="contain">Caber</option>
          <option value="cover">Preencher</option>
          <option value="none">Original</option>
        </select>
      </Field>
    </PropertyGroup>
  );
}

function PlaceholderProps({
  elements,
  update,
}: {
  elements: PlaceholderElement[];
  update: (id: string, patch: Partial<PlaceholderElement>) => void;
}) {
  const first = elements[0];
  const apply = (patch: Partial<PlaceholderElement>) => elements.forEach((e) => update(e.id, patch));

  return (
    <PropertyGroup title="Placeholder">
      <Field label="ID semantico">
        <input
          type="text"
          value={first.placeholderId}
          onChange={(e) => apply({ placeholderId: e.target.value })}
          style={textInputStyle}
          placeholder="roulette-wheel"
        />
      </Field>
      <Field label="Descricao">
        <input
          type="text"
          value={first.description ?? ""}
          onChange={(e) => apply({ description: e.target.value })}
          style={textInputStyle}
          placeholder="Onde a roda gira"
        />
      </Field>
    </PropertyGroup>
  );
}

// =================================================================
// HELPERS DE LAYOUT
// =================================================================

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <div style={fieldValueStyle}>{children}</div>
    </label>
  );
}

const panelStyle: React.CSSProperties = {
  width: 280,
  flexShrink: 0,
  background: "#0d0a08",
  border: "1px solid rgba(212,168,67,0.15)",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  padding: "12px 12px 8px 12px",
  borderBottom: "1px solid rgba(212,168,67,0.1)",
};

const titleStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 1.5,
  color: "#D4A843",
  fontWeight: 700,
};

const multiBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#8a8a8a",
  marginLeft: 8,
};

const scrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  minHeight: 0,
};

const emptyStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#8a8a8a",
  textAlign: "center",
  lineHeight: 1.6,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#8a8a8a",
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

const fieldValueStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const textInputStyle: React.CSSProperties = {
  flex: 1,
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  padding: "4px 6px",
  fontSize: 12,
  color: "#e5e5e5",
  fontFamily: "inherit",
  outline: "none",
};

const colorInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  width: 36,
  height: 24,
  cursor: "pointer",
  padding: 1,
};

const selectStyle: React.CSSProperties = {
  flex: 1,
  background: "#0a0806",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: 3,
  padding: "3px 6px",
  fontSize: 11,
  color: "#e5e5e5",
  fontFamily: "inherit",
};

const readonlyStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#5a5a5a",
  fontFamily: "ui-monospace, monospace",
};

const footerStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 10,
  color: "#5a5a5a",
  textAlign: "center",
  borderTop: "1px solid rgba(212,168,67,0.08)",
  fontFamily: "ui-monospace, monospace",
};

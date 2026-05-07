"use client";

/**
 * BackgroundLayer.tsx
 *
 * EM PALAVRAS SIMPLES: o "fundo" do canvas. Carrega a moldura PNG
 * do jogo (ex: slot-machine-classic-maquina.png) ou um video em loop
 * (firulas, brilho de cassino).
 *
 * TECNICAMENTE: Konva.Layer com listening:false (Karaki pattern,
 * reduz hit graph). Suporta SceneBackground tipo image OU video.
 * Video usa Konva.Animation pra redesenhar a cada frame.
 */
import { Layer, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import type { SceneBackground } from "./state/schema";

interface Props {
  background: SceneBackground;
  width: number;
  height: number;
}

/** Sub-componente: background de IMAGEM estatica (PNG/JPG) */
function ImageBackground({ src, width, height }: { src: string; width: number; height: number }) {
  const [image] = useImage(src, "anonymous");
  if (!image) return null;
  return <KonvaImage image={image} width={width} height={height} listening={false} />;
}

/** Sub-componente: background de VIDEO em loop */
function VideoBackground({ src, poster, width, height }: { src: string; poster?: string; width: number; height: number }) {
  const imageRef = useRef<Konva.Image | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [posterImg] = useImage(poster ?? "", "anonymous");

  // Cria elemento video DOM em memoria (nao adicionado ao DOM real)
  useEffect(() => {
    const v = document.createElement("video");
    v.src = src;
    v.crossOrigin = "anonymous";
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.autoplay = true;
    // play() retorna promise — precisa await OR catch
    v.play().catch(() => {
      /* alguns browsers bloqueiam autoplay sem interacao do user.
         Nesse caso o poster fallback aparece. */
    });
    setVideoEl(v);

    return () => {
      v.pause();
      v.src = "";
    };
  }, [src]);

  // Konva.Animation redesenha a cada frame
  useEffect(() => {
    if (!videoEl || !imageRef.current) return;

    let rafId: number;
    const layer = imageRef.current.getLayer();
    if (!layer) return;

    const draw = () => {
      layer.batchDraw();
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafId);
  }, [videoEl]);

  // Enquanto o video nao carrega, mostra o poster PNG (fallback)
  if (!videoEl && posterImg) {
    return <KonvaImage image={posterImg} width={width} height={height} listening={false} />;
  }
  if (!videoEl) return null;

  return (
    <KonvaImage
      ref={imageRef}
      image={videoEl as unknown as HTMLImageElement}
      width={width}
      height={height}
      listening={false}
    />
  );
}

export default function BackgroundLayer({ background, width, height }: Props) {
  return (
    <Layer listening={false}>
      {background.type === "image" ? (
        <ImageBackground src={background.src} width={width} height={height} />
      ) : (
        <VideoBackground
          src={background.src}
          poster={background.poster}
          width={width}
          height={height}
        />
      )}
    </Layer>
  );
}

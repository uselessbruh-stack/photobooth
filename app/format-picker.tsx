"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formats } from "./lib/print-layout";
import { playBoothSound } from "./lib/booth-sound";

type Choice = { label: string; detail?: string; count?: number; color?: string; ink?: string; previewSrc?: string; swatch?: string };

function ThemeSwatch({ theme, color, ink }: { theme: string; color: string; ink: string }) {
  const confetti = theme === "graphite-confetti";
  const coral = theme === "coral-heart-scatter";
  const pink = theme === "baby-pink-hearts";
  const pencil = theme === "pencil-heart-accent";
  const film = theme === "35mm-film";
  const dihbooth = theme === "dihbooth-film";
  return <svg className="theme-swatch-art" viewBox="0 0 48 72" aria-hidden="true">
    <path d="M6 2 13 3 19 1 25 3 31 2 37 4 43 2 42 9 44 15 42 22 44 29 42 36 44 43 42 50 44 57 42 64 44 70 36 69 30 71 24 69 18 71 12 69 5 70 6 63 4 56 6 49 4 42 6 35 4 28 6 21 4 14 6 8Z" fill={color} stroke={ink} strokeWidth="1.1" strokeLinejoin="round" />
    {pink ? <path d="M24 47c-2-2-11-8-11-14 0-5 6-7 11-2 5-5 11-3 11 2 0 6-9 12-11 14Z" fill="#fffdf9" fillOpacity=".78" stroke={ink} strokeOpacity=".7" strokeWidth=".8" strokeLinejoin="round"/> : <path d="M14 25 20 24 26 25 33 24 34 30 33 36 34 42 33 47 26 46 20 47 14 46 15 40 14 35 15 30Z" fill="#fffdf9" fillOpacity=".78" stroke={pencil ? "#b47f96" : ink} strokeOpacity=".7" strokeWidth={pencil ? "1.6" : ".8"} strokeLinejoin="round" />}
    {pink && <g fill="#a93f5e"><path d="M9 12c-3-3-7 1 0 7 7-6 3-10 0-7Z"/><path d="M39 49c-3-3-7 1 0 7 7-6 3-10 0-7Z"/><path d="M8 57c-2-2-5 1 0 5 5-4 2-7 0-5Z"/></g>}
    {coral && <g fill="#e87568"><path d="M10 16c-3-3-7 1 0 7 7-6 3-10 0-7Z"/><path d="M39 53c-3-3-7 1 0 7 7-6 3-10 0-7Z"/><path d="M37 13c-2-2-5 1 0 5 5-4 2-7 0-5Z"/></g>}
    {confetti && <g strokeLinecap="round"><path d="m8 13 4 3m-2-5-1 6m28 1 3-4m-1 8 2-2M8 56l4-3m25 4 4 3" stroke="#d79c43" strokeWidth="1.6"/><path d="m38 32 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#be7b72"/><circle cx="9" cy="37" r="1.2" fill="#8175a1"/><circle cx="39" cy="62" r="1.2" fill="#8175a1"/></g>}
    {pencil && <g fill="none" stroke="#655d69" strokeLinecap="round" strokeWidth="1"><path d="m7 17 4-5m-3 7 5-6m23 34 4-5m-3 7 5-6"/><path d="m8 55 2-2 2 2-2 2Z" stroke="#b47f96"/><path d="m37 14 3 3-3 3-3-3Z"/></g>}
    {film && <g fill="#f8f6f0"><rect x="7" y="8" width="5" height="5" rx="1.5"/><rect x="36" y="8" width="5" height="5" rx="1.5"/><rect x="7" y="20" width="5" height="5" rx="1.5"/><rect x="36" y="20" width="5" height="5" rx="1.5"/><rect x="7" y="38" width="5" height="5" rx="1.5"/><rect x="36" y="38" width="5" height="5" rx="1.5"/><rect x="7" y="50" width="5" height="5" rx="1.5"/><rect x="36" y="50" width="5" height="5" rx="1.5"/></g>}
    {dihbooth && <g><image href="/frames/dihbooth-film/assets/left-meter-lines.png" x="8.3" y="25" width="5.2" height="22" preserveAspectRatio="none"/><image href="/frames/dihbooth-film/assets/play-up.png" x="38.5" y="24" width="3" height="3"/><image href="/frames/dihbooth-film/assets/play-pause.png" x="36" y="30" width="8" height="8"/><image href="/frames/dihbooth-film/assets/divider-pause.png" x="38.5" y="41" width="3" height="11"/></g>}
  </svg>;
}
export default function FormatPicker({ value, onChange, label = "Layout", heading = "pick your layout", footer = "a layout for every memory", options = formats.map(f => ({ label: f.name, detail: f.size, count: f.count })) }: { value: number; onChange: (value: number) => void; label?: string; heading?: string; footer?: string; options?: Choice[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      list.current?.focus({ preventScroll: true });
      const option = list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
      if (option && list.current) { const box = list.current; if (option.offsetTop < box.scrollTop) box.scrollTop = option.offsetTop; else if (option.offsetTop + option.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = option.offsetTop + option.offsetHeight - box.clientHeight; }
    }
  }, [open, active]);

  function choose(index: number) {
    onChange(index);
    setOpen(false);
    playBoothSound("select");
    trigger.current?.focus({ preventScroll: true });
  }

  return <div className="drawn-picker" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <span id={`${id}-label`} className="format-label">{label}</span>
    <button ref={trigger} type="button" title={options[value].label+(options[value].detail?" — "+options[value].detail:"")} className="format-trigger" aria-haspopup="listbox" aria-expanded={open}
      aria-controls={`${id}-list`} aria-labelledby={`${id}-label ${id}-value`}
      data-sound="menu" onClick={() => { setActive(value); setOpen(!open); }}
      onKeyDown={event => {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          setActive(event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : value);
          setOpen(true); playBoothSound("menu");
        }
      }}>
      <span id={`${id}-value`}>{options[value].color&&<i className="theme-chip" style={{background:options[value].color}}/>}{options[value].label} {options[value].detail&&<span className="format-trigger-name">— {options[value].detail}</span>}</span>
      <span className={`drawn-caret ${open ? "is-open" : ""}`} aria-hidden="true">⌄</span>
    </button>
    {open && <div className="format-popup">
      <div className="format-menu-heading" aria-hidden="true">{heading} <span>↓</span></div>
      <div ref={list} id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} tabIndex={0}
        aria-activedescendant={`${id}-option-${active}`} className={`format-list ${options.some(option => option.swatch) ? "theme-list" : ""}`}
        onKeyDown={event => {
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); playBoothSound("close"); trigger.current?.focus(); }
          else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(active); }
          else if (["ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
            event.preventDefault();
            playBoothSound("tick");
            setActive(current => event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 :
              Math.max(0, Math.min(options.length - 1, current + (event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : event.key === "PageDown" ? 5 : -5))));
          }
        }}>
        {options.map((format, index) => <div key={format.label} id={`${id}-option-${index}`} role="option" aria-label={format.label}
          aria-selected={value === index} data-index={index}
          className={`format-option ${format.swatch ? "format-option-swatch" : ""} ${index === active ? "active" : ""} ${index === value ? "chosen" : ""}`}
          onPointerMove={() => { if (active !== index) setActive(index); }}
          onPointerDown={event => event.preventDefault()} onClick={() => choose(index)}>
          {format.swatch ? <ThemeSwatch theme={format.swatch} color={format.color ?? "#fff"} ink={format.ink ?? "#777"}/> : <>
            <span className="format-option-check" aria-hidden="true">{value === index ? "✓" : ""}</span>
            {format.previewSrc&&<img className="format-option-preview" src={format.previewSrc} alt="" aria-hidden="true"/>}
            <span className="format-option-copy"><strong>{format.color&&<i className="theme-chip" style={{background:format.color}}/>}{format.label}</strong>{format.detail&&<small>{format.detail}</small>}</span>
            {format.count!==undefined&&<span className="format-option-count" aria-hidden="true">{format.count} □</span>}
          </>}
        </div>)}
      </div>
      <div className="format-menu-foot" aria-hidden="true">{footer}</div>
    </div>}
  </div>;
}

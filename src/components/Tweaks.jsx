import React from "react";
import Icon from "./Icon";

export default function Tweaks() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "sunset",
    "showWhatsapp": true
  }/*EDITMODE-END*/;

  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState(TWEAK_DEFAULTS);

  // theme palettes
  const themes = {
    sunset: { paper:'#e8ebf0', paper2:'#d4d9e2', ink:'#0a1430', cream:'#f0f3f7', sunset:'#1d3fc4', sunsetDeep:'#142a85', plum:'#0a1430', jungle:'#1d3fc4', jungleDark:'#0a1430', gold:'#7ec4f5' },
    jungle: { paper:'#e8e9d8', paper2:'#d6d9be', ink:'#0f1d14', cream:'#f4f1dc', sunset:'#d87a3a', sunsetDeep:'#9c4a1b', plum:'#1f2a28', jungle:'#2c6b45', jungleDark:'#0f3a26', gold:'#c2a03a' },
    coast:  { paper:'#eaf1ef', paper2:'#d4e1db', ink:'#0b1f2a', cream:'#f2f7f4', sunset:'#e6874a', sunsetDeep:'#b1491c', plum:'#1e3648', jungle:'#2b6a7a', jungleDark:'#0d2a34', gold:'#d6a658' },
    noche:  { paper:'#0a1430', paper2:'#162046', ink:'#e8ebf0', cream:'#10193a', sunset:'#4a72f0', sunsetDeep:'#2a4fc8', plum:'#1e2a52', jungle:'#4a72f0', jungleDark:'#050a1e', gold:'#7ec4f5' },
  };

  const apply = (s) => {
    const tk = themes[s.theme] || themes.sunset;
    const r = document.documentElement.style;
    r.setProperty('--paper', tk.paper);
    r.setProperty('--paper-2', tk.paper2);
    r.setProperty('--ink', tk.ink);
    r.setProperty('--cream', tk.cream);
    r.setProperty('--sunset', tk.sunset);
    r.setProperty('--sunset-deep', tk.sunsetDeep);
    r.setProperty('--plum', tk.plum);
    r.setProperty('--jungle', tk.jungle);
    r.setProperty('--jungle-dark', tk.jungleDark);
    r.setProperty('--gold', tk.gold);
    document.body.style.background = tk.paper;
    document.body.style.color = tk.ink;
    if (s.theme === 'noche') document.body.classList.add('dark'); else document.body.classList.remove('dark');
  };

  React.useEffect(() => { apply(state); }, [state]);

  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setKey = (k, v) => {
    const n = { ...state, [k]: v };
    setState(n);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  if (!open) return null;
  const palette = [
    { k: 'sunset', c: '#1d3fc4', name: 'Royal' },
    { k: 'jungle', c: '#2c6b45', name: 'Jungle' },
    { k: 'coast',  c: '#2b6a7a', name: 'Coast' },
    { k: 'noche',  c: '#1a1410', name: 'Noche' },
  ];
  return (
    <div className="tweaks">
      <h6>Tweaks · Theme</h6>
      <div className="row">
        <label>Palette</label>
        <div className="swatches">
          {palette.map(p => (
            <button key={p.k} title={p.name} onClick={() => setKey('theme', p.k)}
              style={{background: p.c}} className={state.theme === p.k ? 'active' : ''} />
          ))}
        </div>
      </div>
      <div className="row">
        <label>WhatsApp float</label>
        <input type="checkbox" checked={!!state.showWhatsapp} onChange={e => setKey('showWhatsapp', e.target.checked)} />
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', opacity:.5, marginTop:8}}>
        Toggle Tweaks off to hide panel
      </div>
    </div>
  );
}
Object.assign(window, { Tweaks });

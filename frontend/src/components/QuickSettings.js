import React, { useState, useRef, useEffect } from 'react';
import { useTheme, LANGUAGES } from '../context/ThemeContext';

const THEMES = [
  { key: 'light', icon: '☀️', label: 'Light Mode',  desc: 'Clean white interface' },
  { key: 'dark',  icon: '🌙', label: 'Dark Mode',   desc: 'Easy on the eyes' },
  { key: 'auto',  icon: '🔄', label: 'System',       desc: 'Follows your device' },
];

export default function QuickSettings() {
  const { theme, language, changeTheme, changeLanguage } = useTheme();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('theme'); // 'theme' | 'language'
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const curTheme = THEMES.find(t => t.key === theme) || THEMES[0];
  const curLang  = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div ref={ref} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 8888 }}>
      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 60, right: 0,
          width: 280,
          background: theme === 'dark' ? '#1e293b' : '#fff',
          border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
          borderRadius: 18,
          boxShadow: theme === 'dark'
            ? '0 20px 60px rgba(0,0,0,0.6)'
            : '0 20px 60px rgba(0,0,0,0.14)',
          overflow: 'hidden',
          animation: 'qsSlide 0.2s ease',
        }}>
          <style>{`
            @keyframes qsSlide {
              from { opacity:0; transform:translateY(12px) scale(0.97); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            padding: '0.875rem 1.1rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>⚡ Quick Settings</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem' }}>Theme &amp; Language</div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: '#fff', fontSize: '0.85rem' }}>✕</button>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#f1f5f9'}`, padding: '0 1rem' }}>
            {[{ id: 'theme', icon: '🎨', label: 'Theme' }, { id: 'language', icon: '🌍', label: 'Language' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '0.625rem 0', border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: tab === t.id ? 700 : 500,
                  color: tab === t.id ? '#6366f1' : theme === 'dark' ? '#64748b' : '#94a3b8',
                  fontSize: '0.82rem',
                  borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
                  marginBottom: -1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  transition: 'all 0.15s',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div style={{ padding: '0.875rem 1rem' }}>

            {/* THEME TAB */}
            {tab === 'theme' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {THEMES.map(t => {
                  const active = theme === t.key;
                  return (
                    <button key={t.key} onClick={() => changeTheme(t.key)}
                      id={`qs-theme-${t.key}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.7rem 0.875rem',
                        borderRadius: 12,
                        border: `1.5px solid ${active ? '#6366f1' : theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                        background: active
                          ? (theme === 'dark' ? '#1e1b4b' : '#eef2ff')
                          : (theme === 'dark' ? '#0f172a' : '#f8fafc'),
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: active ? '#6366f1' : theme === 'dark' ? '#1e293b' : '#fff',
                        border: `1px solid ${active ? '#6366f1' : theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', flexShrink: 0,
                        boxShadow: active ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                      }}>{t.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: active ? '#6366f1' : theme === 'dark' ? '#f1f5f9' : '#0f172a' }}>{t.label}</div>
                        <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#64748b' : '#94a3b8', marginTop: 1 }}>{t.desc}</div>
                      </div>
                      {active && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontSize: '0.7rem' }}>✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Live preview strip */}
                <div style={{
                  marginTop: '0.25rem', padding: '0.5rem 0.75rem',
                  borderRadius: 10,
                  background: theme === 'dark' ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                  fontSize: '0.72rem',
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  {curTheme.icon} <span><strong>Active:</strong> {curTheme.label}</span>
                  <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 999, background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.65rem' }}>LIVE</span>
                </div>
              </div>
            )}

            {/* LANGUAGE TAB */}
            {tab === 'language' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {LANGUAGES.map(l => {
                  const active = language === l.code;
                  return (
                    <button key={l.code} onClick={() => changeLanguage(l.code)}
                      id={`qs-lang-${l.code}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.65rem 0.875rem',
                        borderRadius: 12,
                        border: `1.5px solid ${active ? '#6366f1' : theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                        background: active
                          ? (theme === 'dark' ? '#1e1b4b' : '#eef2ff')
                          : (theme === 'dark' ? '#0f172a' : '#f8fafc'),
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: active ? (theme === 'dark' ? '#1e1b4b' : '#eef2ff') : (theme === 'dark' ? '#1e293b' : '#fff'),
                        border: `1px solid ${active ? '#6366f1' : theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem', flexShrink: 0,
                      }}>{l.flag}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: active ? '#6366f1' : theme === 'dark' ? '#f1f5f9' : '#0f172a' }}>{l.nativeLabel}</div>
                        <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#64748b' : '#94a3b8', marginTop: 1 }}>{l.label}</div>
                      </div>
                      {active && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontSize: '0.7rem' }}>✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}

                <div style={{
                  marginTop: '0.25rem', padding: '0.5rem 0.75rem',
                  borderRadius: 10,
                  background: theme === 'dark' ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                  fontSize: '0.72rem',
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  {curLang.flag} <span><strong>Active:</strong> {curLang.nativeLabel} ({curLang.label})</span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(o => !o)}
        id="quick-settings-fab"
        title="Quick Settings — Theme & Language"
        style={{
          width: 50, height: 50,
          borderRadius: '50%',
          border: 'none',
          background: open
            ? 'linear-gradient(135deg, #ef4444, #f97316)'
            : 'linear-gradient(135deg, #6366f1, #818cf8)',
          color: '#fff',
          fontSize: '1.3rem',
          cursor: 'pointer',
          boxShadow: open
            ? '0 6px 20px rgba(239,68,68,0.5)'
            : '0 6px 20px rgba(99,102,241,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
        {open ? '✕' : (theme === 'dark' ? '🌙' : '☀️')}
      </button>
    </div>
  );
}

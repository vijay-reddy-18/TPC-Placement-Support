import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { value: 'general',       label: 'General',       icon: '📖' },
  { value: 'policy',        label: 'Policy',         icon: '📋' },
  { value: 'placement',     label: 'Placement',      icon: '🏢' },
  { value: 'internship',    label: 'Internship',     icon: '💼' },
  { value: 'documents',     label: 'Documents',      icon: '📄' },
  { value: 'faq',           label: 'FAQ',            icon: '❓' },
  { value: 'announcements', label: 'Announcements',  icon: '📢' },
];

const AUDIENCES = [
  { value: 'all',     label: 'All Users (Student + TPC)',  icon: '👥' },
  { value: 'student', label: 'Students Only',              icon: '🎓' },
  { value: 'tpc',     label: 'TPC Staff Only',             icon: '👔' },
];

const catMeta = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

function ArticleEditor({ article, onClose, onSave }) {
  const [form, setForm] = useState({
    title:          article?.title || '',
    category:       article?.category || 'general',
    content:        article?.content || '',
    targetAudience: article?.targetAudience || 'all',
    tags:           article?.tags?.join(', ') || '',
    status:         article?.status || 'draft',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (publishNow = false) => {
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), status: publishNow ? 'published' : form.status };
      if (article?._id) {
        await api.put(`/admin/kb/${article._id}`, payload);
      } else {
        await api.post('/admin/kb', payload);
      }
      toast.success(publishNow ? '📢 Article published! All users notified.' : 'Article saved as draft');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, width: 720, maxWidth: '98vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '20px 20px 0 0' }}>
          <div>
            <h4 style={{ color: '#fff', margin: 0, fontWeight: 700, fontSize: '1rem' }}>{article?._id ? '✏️ Edit Article' : '📝 New KB Article'}</h4>
            <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.78rem' }}>Published articles notify all targeted users automatically</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: '1rem' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Title */}
          <div>
            <label style={LS}>Article Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. How to check placement eligibility?" style={IS} id="kb-title" />
          </div>

          {/* Category + Audience */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={LS}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {CATEGORIES.map(c => (
                  <button key={c.value} type="button" onClick={() => set('category', c.value)}
                    style={{ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${form.category === c.value ? '#6366f1' : '#e2e8f0'}`, background: form.category === c.value ? '#eef2ff' : '#fff', color: form.category === c.value ? '#6366f1' : '#475569', fontWeight: form.category === c.value ? 700 : 400, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={LS}>Notify / Visible To</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {AUDIENCES.map(a => (
                  <button key={a.value} type="button" onClick={() => set('targetAudience', a.value)}
                    style={{ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${form.targetAudience === a.value ? '#0ea5e9' : '#e2e8f0'}`, background: form.targetAudience === a.value ? '#f0f9ff' : '#fff', color: form.targetAudience === a.value ? '#0ea5e9' : '#475569', fontWeight: form.targetAudience === a.value ? 700 : 400, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <label style={LS}>Content * <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(Markdown supported: ## Heading, **bold**, - list)</span></label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={14}
              placeholder="Write the full article here. Use ## for headings, **text** for bold, - for bullet points..."
              style={{ ...IS, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical' }} id="kb-content" />
          </div>

          {/* Tags */}
          <div>
            <label style={LS}>Tags <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(comma separated)</span></label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. placement, eligibility, cgpa" style={IS} id="kb-tags" />
          </div>

          {/* Status info */}
          <div style={{ padding: '0.75rem', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', fontSize: '0.8rem', color: '#92400e' }}>
            💡 <strong>Draft</strong> = saved but not visible to users. <strong>Publish</strong> = immediately visible + sends a notification to {AUDIENCES.find(a => a.value === form.targetAudience)?.label || 'All Users'}.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Cancel</button>
            <button onClick={() => handleSave(false)} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
              {saving ? '...' : '💾 Save as Draft'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
              {saving ? '...' : '📢 Publish & Notify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple markdown renderer for preview
function MarkdownPreview({ content }) {
  const rendered = content
    .replace(/^## (.+)$/gm, '<h3 style="font-size:1rem;font-weight:700;margin:1rem 0 0.4rem;color:#0f172a">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 style="font-size:0.9rem;font-weight:700;margin:0.75rem 0 0.3rem;color:#0f172a">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:0.3rem;padding-left:0.25rem">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #6366f1;padding:0.5rem 1rem;background:#f8fafc;margin:0.5rem 0;border-radius:0 8px 8px 0;font-style:italic;color:#475569">$1</blockquote>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return <div dangerouslySetInnerHTML={{ __html: rendered }} style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.87rem' }} />;
}

const LS = { fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 };
const IS = { width: '100%', padding: '9px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', outline: 'none', color: '#0f172a', background: '#f8fafc' };

export default function AdminKnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', targetRole: 'all', type: 'info' });
  const [showBroadcast, setShowBroadcast] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/kb');
      setArticles(res.data.articles || []);
    } catch { toast.error('Failed to load KB'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try { await api.delete(`/admin/kb/${id}`); toast.success('Article deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleTogglePublish = async (id, currentStatus, title) => {
    try {
      await api.post(`/admin/kb/${id}/publish`);
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      toast.success(newStatus === 'published' ? `📢 "${title}" published! Users notified.` : `"${title}" moved to draft`);
      load();
    } catch { toast.error('Failed'); }
  };

  const sendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) { toast.error('Title and message required'); return; }
    setBroadcasting(true);
    try {
      await api.post('/admin/notify', broadcastForm);
      toast.success(`📣 Notification sent to ${broadcastForm.targetRole === 'all' ? 'everyone' : broadcastForm.targetRole}!`);
      setShowBroadcast(false);
      setBroadcastForm({ title: '', message: '', targetRole: 'all', type: 'info' });
    } catch { toast.error('Failed to send notification'); } finally { setBroadcasting(false); }
  };

  const filtered = articles.filter(a => {
    const matchCat = filterCat === 'all' || a.category === filterCat;
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.tags || []).join(' ').includes(search.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  const published = articles.filter(a => a.status === 'published').length;
  const drafts = articles.filter(a => a.status === 'draft').length;

  return (
    <div>
      <style>{`
        .kb-card { background:#fff; border-radius:12px; border:1px solid #f1f5f9; boxShadow:0 2px 8px rgba(0,0,0,0.04); transition:all 0.15s; }
        .kb-card:hover { box-shadow:0 6px 20px rgba(0,0,0,0.08); transform:translateY(-1px); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>📚 Knowledge Base</h2>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Manage FAQ articles — published articles notify users automatically</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowBroadcast(true)} id="kb-broadcast-btn"
            style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #fde68a', background: '#fffbeb', color: '#92400e', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📣 Broadcast Notification
          </button>
          <button onClick={() => { setEditingArticle(null); setShowEditor(true); }} id="kb-new-article-btn"
            style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            ✚ New Article
          </button>
        </div>
      </div>

      {/* Stats Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: articles.length, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Published', value: published, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Drafts', value: drafts, color: '#f59e0b', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} style={{ padding: '7px 16px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 700, fontSize: '0.82rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem' }}>{s.value}</span>
            <span style={{ opacity: 0.7 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', background: '#fff', padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
        <input placeholder="🔍 Search articles or tags..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: '0.87rem', outline: 'none' }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: '0.87rem', outline: 'none', color: '#475569' }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: '0.87rem', outline: 'none', color: '#475569' }}>
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Article Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading articles...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#fff', borderRadius: 14 }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
          No articles found. Create your first article!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {filtered.map(article => {
            const cat = catMeta[article.category] || { icon: '📖', label: article.category };
            const isPublished = article.status === 'published';
            return (
              <div key={article._id} className="kb-card" style={{ padding: '1.1rem', cursor: 'pointer' }} onClick={() => setPreviewArticle(article)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isPublished ? '#eef2ff' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{cat.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{cat.label} · {article.views || 0} views</div>
                    </div>
                  </div>
                  <span style={{ padding: '3px 9px', borderRadius: 999, fontWeight: 700, fontSize: '0.7rem', background: isPublished ? '#f0fdf4' : '#fffbeb', color: isPublished ? '#15803d' : '#a16207', flexShrink: 0, marginLeft: 4 }}>
                    {isPublished ? '● Live' : '○ Draft'}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.55, margin: '0 0 0.875rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {article.excerpt || article.content?.slice(0, 120)}
                </p>

                {(article.tags || []).length > 0 && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {article.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ padding: '2px 7px', borderRadius: 999, background: '#f1f5f9', color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>#{tag}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid #f8fafc', paddingTop: '0.75rem' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditingArticle(article); setShowEditor(true); }}
                    style={{ flex: 1, padding: '6px', borderRadius: 8, border: '1.5px solid #c7d2fe', background: '#eef2ff', color: '#6366f1', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleTogglePublish(article._id, article.status, article.title)}
                    style={{ flex: 1, padding: '6px', borderRadius: 8, border: `1.5px solid ${isPublished ? '#fde68a' : '#bbf7d0'}`, background: isPublished ? '#fffbeb' : '#f0fdf4', color: isPublished ? '#a16207' : '#15803d', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>
                    {isPublished ? '📥 Unpublish' : '📢 Publish'}
                  </button>
                  <button onClick={() => handleDelete(article._id, article.title)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Article Editor */}
      {showEditor && (
        <ArticleEditor
          article={editingArticle}
          onClose={() => { setShowEditor(false); setEditingArticle(null); }}
          onSave={load}
        />
      )}

      {/* Article Preview Modal */}
      {previewArticle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setPreviewArticle(null); }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 680, maxWidth: '98vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', borderRadius: '16px 16px 0 0' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{catMeta[previewArticle.category]?.icon} {previewArticle.category} · {previewArticle.status}</div>
                <h4 style={{ color: '#fff', margin: '4px 0 0', fontWeight: 700, fontSize: '1rem' }}>{previewArticle.title}</h4>
              </div>
              <button onClick={() => setPreviewArticle(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: '1rem', alignSelf: 'flex-start' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <MarkdownPreview content={previewArticle.content} />
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Notification Modal */}
      {showBroadcast && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setShowBroadcast(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 480, maxWidth: '98vw', boxShadow: '0 25px 70px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>📣 Broadcast Notification</h4>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.78rem' }}>Send an announcement to students and/or TPC team</p>
              </div>
              <button onClick={() => setShowBroadcast(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={LS}>Notification Title *</label>
                <input value={broadcastForm.title} onChange={e => setBroadcastForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Important Placement Update" style={IS} id="broadcast-title" />
              </div>
              <div>
                <label style={LS}>Message *</label>
                <textarea value={broadcastForm.message} onChange={e => setBroadcastForm(p => ({ ...p, message: e.target.value }))} rows={4} placeholder="Write the notification message here..." style={{ ...IS, resize: 'vertical' }} id="broadcast-message" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={LS}>Send To</label>
                  <select value={broadcastForm.targetRole} onChange={e => setBroadcastForm(p => ({ ...p, targetRole: e.target.value }))} style={IS}>
                    <option value="all">Everyone (Students + TPC)</option>
                    <option value="student">Students Only</option>
                    <option value="tpc">TPC Staff Only</option>
                  </select>
                </div>
                <div>
                  <label style={LS}>Type</label>
                  <select value={broadcastForm.type} onChange={e => setBroadcastForm(p => ({ ...p, type: e.target.value }))} style={IS}>
                    <option value="info">ℹ️ Info</option>
                    <option value="success">✅ Success</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="alert">🚨 Alert</option>
                    <option value="announcement">📢 Announcement</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowBroadcast(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Cancel</button>
                <button onClick={sendBroadcast} disabled={broadcasting}
                  style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: broadcasting ? '#fde68a' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', cursor: broadcasting ? 'not-allowed' : 'pointer', fontWeight: 700 }} id="broadcast-send-btn">
                  {broadcasting ? 'Sending...' : '📣 Send Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

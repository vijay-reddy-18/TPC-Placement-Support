import React, { useState, useEffect } from 'react';
import TPCLayout from '../components/TPCLayout';
import { toast } from 'react-toastify';
import { Modal, Form, Button } from 'react-bootstrap';

const INITIAL_ARTICLES = [
    { id:1, category:'placement', title:'How to guide a student through the placement process', body:'Step 1: Verify the student is eligible based on CGPA criteria...\n\nStep 2: Confirm they have registered on the company portal...\n\nStep 3: Send them the company JD and instructions.', tags:['placement','eligibility'], pinned:true },
    { id:2, category:'internship', title:'Internship offer letter processing steps', body:'When a student receives an internship offer:\n1. Collect the offer letter copy\n2. Verify company name and compensation\n3. Forward to TPC head for approval\n4. Record in student internship register', tags:['internship','offer-letter'], pinned:false },
    { id:3, category:'document', title:'NOC and bonafide certificate process', body:'For NOC requests:\n- Collect student ID and department NOC form\n- TPC head sign-off required within 2 working days\n\nFor bonafide:\n- Academic office handles this directly. Refer students there.', tags:['document','noc'], pinned:false },
    { id:4, category:'other', title:'Quick reply: Thank you for reaching out', body:'Thank you for reaching out to TPC Support. We have received your query and will respond within 24-48 hours. For urgent matters, please mention "URGENT" in your follow-up message.', tags:['template','quick-reply'], pinned:true },
    { id:5, category:'other', title:'Quick reply: Issue resolved — closing ticket', body:'Hi, your query has been resolved. If you have any further questions or if the issue persists, please reply to this message or raise a new ticket. Thank you!', tags:['template','quick-reply'], pinned:true },
];

const CATEGORIES = ['all','placement','internship','document','interview-schedule','offer-letter','other'];

const TPCKnowledgeBase = () => {
    const [articles, setArticles] = useState(INITIAL_ARTICLES);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editArticle, setEditArticle] = useState(null);
    const [viewArticle, setViewArticle] = useState(null);
    const [form, setForm] = useState({ title:'', category:'other', body:'', tags:'' });
    const [idCounter, setIdCounter] = useState(100);

    const filtered = articles.filter(a => {
        const matchCat = catFilter === 'all' || a.category === catFilter;
        const matchSearch = !search.trim() || a.title.toLowerCase().includes(search.toLowerCase())
            || a.body.toLowerCase().includes(search.toLowerCase())
            || (a.tags||[]).some(t => t.includes(search.toLowerCase()));
        return matchCat && matchSearch;
    });

    const pinned = filtered.filter(a => a.pinned);
    const regular = filtered.filter(a => !a.pinned);
    const templates = articles.filter(a => (a.tags||[]).includes('quick-reply'));

    const openCreate = () => { setEditArticle(null); setForm({ title:'', category:'other', body:'', tags:'' }); setShowModal(true); };
    const openEdit = (a) => { setEditArticle(a); setForm({ title:a.title, category:a.category, body:a.body, tags:(a.tags||[]).join(', ') }); setShowModal(true); };

    const handleSave = () => {
        if (!form.title.trim() || !form.body.trim()) { toast.warning('Title and body are required'); return; }
        const tags = form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        if (editArticle) {
            setArticles(prev => prev.map(a => a.id === editArticle.id ? { ...a, ...form, tags } : a));
            toast.success('Article updated!');
        } else {
            setArticles(prev => [...prev, { id: idCounter, ...form, tags, pinned: false }]);
            setIdCounter(c => c+1);
            toast.success('Article created!');
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this article?')) return;
        setArticles(prev => prev.filter(a => a.id !== id));
        toast.info('Article deleted');
        setViewArticle(null);
    };

    const togglePin = (id) => {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a));
    };

    const copyTemplate = (body) => {
        navigator.clipboard?.writeText(body).then(() => toast.success('Template copied to clipboard!')).catch(() => toast.info('Copy this template manually'));
    };

    const ArticleCard = ({ article }) => (
        <div style={{
            background:'#fff', borderRadius:10, border:'1px solid #e2e8f0',
            padding:'1rem 1.1rem', cursor:'pointer', transition:'box-shadow 0.15s',
            borderLeft: article.pinned ? '4px solid #3b82f6' : '1px solid #e2e8f0',
        }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 15px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
        >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.75rem' }}>
                <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'0.4rem' }}>
                        <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#3b82f6', background:'#eff6ff', padding:'2px 8px', borderRadius:999 }}>
                            {article.category}
                        </span>
                        {(article.tags||[]).includes('quick-reply') && (
                            <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#8b5cf6', background:'#f5f3ff', padding:'2px 8px', borderRadius:999 }}>
                                📝 Template
                            </span>
                        )}
                        {article.pinned && <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#f59e0b', background:'#fffbeb', padding:'2px 8px', borderRadius:999 }}>📌 Pinned</span>}
                    </div>
                    <div style={{ fontWeight:700, color:'#0f172a', fontSize:'0.9rem', marginBottom:'0.35rem' }} onClick={() => setViewArticle(article)}>
                        {article.title}
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'#64748b', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                        {article.body}
                    </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem', flexShrink:0 }}>
                    <button onClick={() => setViewArticle(article)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:'0.75rem', fontWeight:600, color:'#374151' }}>View</button>
                    <button onClick={() => openEdit(article)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0', background:'#eff6ff', cursor:'pointer', fontSize:'0.75rem', fontWeight:600, color:'#3b82f6' }}>Edit</button>
                    <button onClick={() => togglePin(article.id)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0', background: article.pinned?'#fffbeb':'#f8fafc', cursor:'pointer', fontSize:'0.75rem', fontWeight:600, color:article.pinned?'#f59e0b':'#94a3b8' }}>
                        {article.pinned ? '📌 Unpin' : 'Pin'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <TPCLayout pageTitle="Knowledge Base" openTicketCount={0}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
                <div style={{ display:'flex', gap:'0.6rem', alignItems:'center', flex:1 }}>
                    <div style={{ flex:1, maxWidth:400, display:'flex', alignItems:'center', gap:'0.5rem', background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'6px 12px' }}>
                        <span style={{ color:'#94a3b8' }}>🔍</span>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles and templates..." style={{ flex:1, border:'none', outline:'none', fontSize:'0.85rem' }} id="kb-search" />
                        {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>✕</button>}
                    </div>
                    <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding:'7px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:'0.83rem', fontWeight:500, cursor:'pointer', background:'#fff' }} id="kb-cat-filter">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                    </select>
                </div>
                <button onClick={openCreate} style={{ padding:'8px 18px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.4rem' }} id="kb-create-btn">
                    ➕ New Article
                </button>
            </div>

            {/* Quick Reply Templates */}
            <div style={{ marginBottom:'1.5rem' }}>
                <h3 style={{ fontWeight:700, color:'#0f172a', fontSize:'0.95rem', marginBottom:'0.75rem' }}>📝 Quick Reply Templates</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'0.75rem' }}>
                    {templates.map(t => (
                        <div key={t.id} style={{ background:'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:10, padding:'0.875rem 1rem' }}>
                            <div style={{ fontWeight:700, color:'#5b21b6', fontSize:'0.85rem', marginBottom:'0.4rem' }}>{t.title}</div>
                            <div style={{ fontSize:'0.78rem', color:'#6d28d9', lineHeight:1.5, marginBottom:'0.75rem', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                                {t.body}
                            </div>
                            <button onClick={() => copyTemplate(t.body)} style={{ padding:'5px 12px', background:'#7c3aed', color:'#fff', border:'none', borderRadius:6, fontWeight:600, fontSize:'0.75rem', cursor:'pointer' }} id={`copy-template-${t.id}`}>
                                📋 Copy to Clipboard
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pinned Articles */}
            {pinned.length > 0 && (
                <div style={{ marginBottom:'1.5rem' }}>
                    <h3 style={{ fontWeight:700, color:'#0f172a', fontSize:'0.95rem', marginBottom:'0.75rem' }}>📌 Pinned Articles</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                        {pinned.map(a => <ArticleCard key={a.id} article={a} />)}
                    </div>
                </div>
            )}

            {/* All Articles */}
            <div>
                <h3 style={{ fontWeight:700, color:'#0f172a', fontSize:'0.95rem', marginBottom:'0.75rem' }}>
                    📚 Articles ({regular.length})
                </h3>
                {regular.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'2.5rem', background:'#fff', borderRadius:12, border:'1px dashed #cbd5e1', color:'#94a3b8', fontSize:'0.88rem' }}>
                        {search ? 'No articles match your search' : 'No articles yet. Create one to get started!'}
                    </div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                        {regular.map(a => <ArticleCard key={a.id} article={a} />)}
                    </div>
                )}
            </div>

            {/* View Modal */}
            <Modal show={!!viewArticle} onHide={() => setViewArticle(null)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize:'1rem', fontWeight:700 }}>{viewArticle?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{ marginBottom:'0.75rem', display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#3b82f6', background:'#eff6ff', padding:'2px 8px', borderRadius:999 }}>{viewArticle?.category}</span>
                        {(viewArticle?.tags||[]).map(tag => <span key={tag} style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b', background:'#f1f5f9', padding:'2px 8px', borderRadius:999 }}>{tag}</span>)}
                    </div>
                    <div style={{ background:'#f8fafc', borderRadius:8, padding:'1rem', fontFamily:'monospace', fontSize:'0.85rem', lineHeight:1.75, color:'#1e293b', whiteSpace:'pre-wrap', border:'1px solid #e2e8f0' }}>
                        {viewArticle?.body}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(viewArticle?.id)}>🗑 Delete</Button>
                    <Button variant="outline-primary" size="sm" onClick={() => { openEdit(viewArticle); setViewArticle(null); }}>✏️ Edit</Button>
                    {(viewArticle?.tags||[]).includes('quick-reply') && (
                        <Button variant="primary" size="sm" onClick={() => copyTemplate(viewArticle?.body)}>📋 Copy Template</Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize:'1rem', fontWeight:700 }}>{editArticle ? '✏️ Edit Article' : '➕ New Article'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-2">
                        <Form.Label style={{ fontWeight:600, fontSize:'0.85rem' }}>Title *</Form.Label>
                        <Form.Control value={form.title} onChange={e => setForm(p => ({...p, title:e.target.value}))} placeholder="Article title..." id="kb-article-title" />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label style={{ fontWeight:600, fontSize:'0.85rem' }}>Category</Form.Label>
                        <Form.Select value={form.category} onChange={e => setForm(p => ({...p, category:e.target.value}))} id="kb-article-category">
                            {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label style={{ fontWeight:600, fontSize:'0.85rem' }}>Content *</Form.Label>
                        <Form.Control as="textarea" rows={6} value={form.body} onChange={e => setForm(p => ({...p, body:e.target.value}))} placeholder="Write article content... (tip: add 'quick-reply' to tags to make it a template)" id="kb-article-body" />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label style={{ fontWeight:600, fontSize:'0.85rem' }}>Tags (comma-separated)</Form.Label>
                        <Form.Control value={form.tags} onChange={e => setForm(p => ({...p, tags:e.target.value}))} placeholder="e.g. placement, template, quick-reply" id="kb-article-tags" />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleSave}>
                        {editArticle ? 'Update Article' : 'Create Article'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </TPCLayout>
    );
};

export default TPCKnowledgeBase;

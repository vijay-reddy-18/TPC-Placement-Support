import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../../services/api';
import StudentLayout from '../../components/StudentLayout';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { value: 'placement',          label: 'Placement',           icon: '🏢', desc: 'Campus placement drives, company visits' },
  { value: 'internship',         label: 'Internship',          icon: '💼', desc: 'Internship opportunities and issues' },
  { value: 'document',           label: 'Documents',           icon: '📄', desc: 'NOC, bonafide, offer letters' },
  { value: 'company-eligibility',label: 'Eligibility',         icon: '✅', desc: 'Company eligibility criteria doubts' },
  { value: 'interview-schedule', label: 'Interview Schedule',  icon: '📅', desc: 'Interview timing and preparation queries' },
  { value: 'offer-letter',       label: 'Offer Letter',        icon: '📝', desc: 'Offer letter status and issues' },
  { value: 'other',              label: 'Other',               icon: '📌', desc: 'Any other placement-related query' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    icon: '🟢', color: '#10b981', bg: '#ecfdf5', desc: 'Can wait a few days' },
  { value: 'medium', label: 'Medium', icon: '🟡', color: '#f59e0b', bg: '#fffbeb', desc: 'Standard response time' },
  { value: 'high',   label: 'High',   icon: '🔴', color: '#ef4444', bg: '#fef2f2', desc: 'Needs quick resolution' },
  { value: 'urgent', label: 'Urgent', icon: '🔥', color: '#7c3aed', bg: '#f5f3ff', desc: 'Critical / time sensitive' },
];

const DEPARTMENTS = [
  { value: 'cse', label: 'CSE — Computer Science' },
  { value: 'ece', label: 'ECE — Electronics' },
  { value: 'mech', label: 'MECH — Mechanical' },
  { value: 'civil', label: 'Civil Engineering' },
  { value: 'eee', label: 'EEE — Electrical' },
  { value: 'it', label: 'IT — Information Technology' },
  { value: 'other', label: 'Other' },
];

const StudentCreateTicket = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [form, setForm] = useState({
    category: '',
    priority: 'medium',
    department: 'cse',
    title: '',
    description: '',
    files: [],
  });

  const MAX_TITLE = 100;
  const MAX_DESC = 1000;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setForm(prev => ({ ...prev, files: [...prev.files, ...files].slice(0, 5) }));
  };

  const canProceedStep1 = form.category !== '';
  const canProceedStep2 = form.title.trim().length >= 5 && form.description.trim().length >= 10;

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await ticketAPI.createTicket(
        form.title.trim(),
        form.description.trim(),
        form.category,
        form.priority,
        form.department,
      );
      toast.success('🎉 Ticket created successfully!');
      navigate(`/student/tickets/${res.data.ticket._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_LABELS = ['Category & Priority', 'Describe Issue', 'Review & Submit'];

  return (
    <StudentLayout title="Raise a Ticket" subtitle="Describe your issue and we'll get back to you soon">
      <div className="sp-card" style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Wizard Header */}
        <div className="sp-wizard-header">
          <div className="sp-wizard-title">🎫 New Support Ticket</div>
          <div className="sp-wizard-sub">Fill in the details below and our TPC team will respond shortly</div>

          {/* Steps bar */}
          <div className="sp-steps-bar" style={{ marginTop: '1.5rem' }}>
            {STEP_LABELS.map((label, i) => {
              const num = i + 1;
              const state = step > num ? 'done' : step === num ? 'active' : '';
              return (
                <React.Fragment key={num}>
                  <div className="sp-step-item">
                    <div className={`sp-step-num ${state}`}>
                      {state === 'done' ? '✓' : num}
                    </div>
                    <span className={`sp-step-label ${state}`}>{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`sp-step-connector ${step > num ? 'done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="sp-card-body" style={{ padding: '2rem' }}>
          {/* ===== STEP 1: Category & Priority ===== */}
          {step === 1 && (
            <div>
              <div className="sp-form-group">
                <label className="sp-label" style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
                  📂 Select Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="sp-category-grid">
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.value}
                      className={`sp-cat-card ${form.category === cat.value ? 'selected' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                      id={`cat-${cat.value}`}
                    >
                      <div className="sp-cat-icon">{cat.icon}</div>
                      <div className="sp-cat-name">{cat.label}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--sp-text-muted)', marginTop: 3, lineHeight: 1.3 }}>{cat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sp-form-group" style={{ marginTop: '1.5rem' }}>
                <label className="sp-label" style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
                  🎯 Select Priority
                </label>
                <div className="sp-priority-grid">
                  {PRIORITIES.map((p) => (
                    <div
                      key={p.value}
                      className={`sp-pri-card ${form.priority === p.value ? 'selected' : ''}`}
                      style={form.priority === p.value ? { background: p.bg, borderColor: p.color } : {}}
                      onClick={() => setForm(prev => ({ ...prev, priority: p.value }))}
                      id={`pri-${p.value}`}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{p.icon}</div>
                      <div className="sp-pri-label" style={{ color: form.priority === p.value ? p.color : 'var(--sp-text-primary)' }}>{p.label}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--sp-text-muted)', marginTop: 2 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sp-form-group" style={{ marginTop: '1.25rem' }}>
                <label className="sp-label">🏫 Department</label>
                <select
                  id="create-dept"
                  className="sp-select"
                  value={form.department}
                  onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                >
                  {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  className="sp-btn sp-btn-primary"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  id="step1-next"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Describe Issue ===== */}
          {step === 2 && (
            <div>
              <div className="sp-form-group">
                <label className="sp-label">
                  📌 Subject / Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="create-title"
                  className="sp-input"
                  placeholder="Brief summary of your issue (min 5 characters)"
                  value={form.title}
                  maxLength={MAX_TITLE}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <div className="sp-char-count">{form.title.length}/{MAX_TITLE}</div>
              </div>

              <div className="sp-form-group">
                <label className="sp-label">
                  📝 Detailed Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="create-description"
                  className="sp-textarea"
                  rows={6}
                  placeholder="Explain your issue in detail — include company name, date, what happened, and what you need from TPC..."
                  value={form.description}
                  maxLength={MAX_DESC}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="sp-char-count">{form.description.length}/{MAX_DESC}</div>
              </div>

              <div className="sp-form-group">
                <label className="sp-label">📎 Attach Files (optional)</label>
                <div
                  className={`sp-dropzone ${dragging ? 'dragging' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                  id="create-dropzone"
                >
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setForm(prev => ({ ...prev, files: [...prev.files, ...files].slice(0, 5) }));
                    }}
                  />
                  <div className="sp-dropzone-icon">📁</div>
                  <div className="sp-dropzone-text">
                    {form.files.length > 0
                      ? `${form.files.length} file(s) selected`
                      : 'Drag & drop files here, or click to browse'}
                  </div>
                  <div className="sp-dropzone-hint">PDF, PNG, JPG, DOC — Max 5 files</div>
                </div>
                {form.files.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {form.files.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem' }}>
                        📎 {f.name}
                        <button onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, files: prev.files.filter((_, fi) => fi !== i) })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button className="sp-btn sp-btn-ghost" onClick={() => setStep(1)} id="step2-back">← Back</button>
                <button
                  className="sp-btn sp-btn-primary"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  id="step2-next"
                >
                  Review →
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Review & Submit ===== */}
          {step === 3 && (
            <div>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--sp-border)' }}>
                <h4 style={{ margin: '0 0 1rem', fontWeight: 800, color: 'var(--sp-text-primary)', fontSize: '1rem' }}>📋 Review Your Ticket</h4>

                {[
                  { label: 'Category',    value: CATEGORIES.find(c => c.value === form.category)?.label || form.category },
                  { label: 'Priority',    value: PRIORITIES.find(p => p.value === form.priority)?.label || form.priority },
                  { label: 'Department',  value: DEPARTMENTS.find(d => d.value === form.department)?.label || form.department },
                  { label: 'Title',       value: form.title },
                  { label: 'Files',       value: form.files.length ? `${form.files.length} file(s)` : 'None' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--sp-border)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--sp-text-muted)', fontWeight: 600, minWidth: 90 }}>{label}</span>
                    <span style={{ color: 'var(--sp-text-primary)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}

                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)', fontWeight: 600, marginBottom: 6 }}>DESCRIPTION</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--sp-text-secondary)', lineHeight: 1.65, background: '#fff', padding: '0.875rem', borderRadius: 8, border: '1px solid var(--sp-border)', whiteSpace: 'pre-wrap' }}>
                    {form.description}
                  </div>
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#fffbeb', border: '1px solid #f59e0b30', borderRadius: 8, fontSize: '0.82rem', color: '#b45309', marginBottom: '1.5rem' }}>
                ⚠️ Once submitted, your ticket will be reviewed by the TPC team. You can track it in <strong>My Tickets</strong>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="sp-btn sp-btn-ghost" onClick={() => setStep(2)} id="step3-back">← Back</button>
                <button
                  className="sp-btn sp-btn-primary sp-btn-lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                  id="submit-ticket-btn"
                >
                  {submitting ? '⏳ Submitting...' : '🚀 Submit Ticket'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentCreateTicket;

import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Plus, X, Trash2, ChevronRight } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#14b8a6']
const ICONS = ['📚', '📐', '🔬', '📊', '🌍', '💻', '📖', '🎨', '🧮', '🗺️', '⚗️', '📝']

function SubjectModal({ open, onClose, onSave }) {
    const [name, setName] = useState('')
    const [color, setColor] = useState(COLORS[0])
    const [icon, setIcon] = useState(ICONS[0])
    const [loading, setLoading] = useState(false)

    async function handleSave() {
        if (!name.trim()) return
        setLoading(true)
        await onSave({ name: name.trim(), color, icon })
        setName('')
        setColor(COLORS[0])
        setIcon(ICONS[0])
        setLoading(false)
        onClose()
    }

    if (!open) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add New Subject</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Subject Name</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Mathematics, Physics, History..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Choose Icon</label>
                        <div className="icon-grid">
                            {ICONS.map(ic => (
                                <button
                                    key={ic}
                                    className={`icon-btn ${icon === ic ? 'active' : ''}`}
                                    onClick={() => setIcon(ic)}
                                >
                                    {ic}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-grid">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    className={`color-btn ${color === c ? 'active' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={loading || !name.trim()}>
                        {loading ? <span className="spinner" /> : <><Plus size={14} /> Add Subject</>}
                    </button>
                </div>
            </div>

            <style>{`
        .modal-overlay { position: fixed; inset: 0; background: var(--overlay-bg); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
        .modal-box { background: var(--bg-2); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); width: 100%; max-width: 440px; overflow: hidden; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--glass-border); }
        .modal-header h3 { font-size: 16px; font-weight: 700; }
        .modal-close { color: var(--text-3); padding: 4px; border-radius: 6px; cursor: pointer; transition: color 0.15s; }
        .modal-close:hover { color: var(--text-1); }
        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end; gap: 10px; }
        .icon-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
        .icon-btn { padding: 8px; border-radius: 8px; font-size: 18px; cursor: pointer; background: var(--glass); border: 1px solid var(--glass-border); transition: all 0.15s; }
        .icon-btn.active { background: rgba(99,102,241,0.15); border-color: var(--brand-from); }
        .icon-btn:hover { border-color: var(--brand-from); }
        .color-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; }
        .color-btn { width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.15s; }
        .color-btn.active { border-color: white; transform: scale(1.15); }
        .color-btn:hover { transform: scale(1.1); }
      `}</style>
        </div>
    )
}

export default function Subjects() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const ctx = useOutletContext()
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        if (ctx?.addSubjectOpen) {
            setModalOpen(true)
            ctx.setAddSubjectOpen(false)
        }
    }, [ctx?.addSubjectOpen])

    useEffect(() => {
        fetchSubjects()
    }, [])

    async function fetchSubjects() {
        const { data } = await supabase
            .from('subjects')
            .select('*')
            .order('created_at', { ascending: false })
        setSubjects(data || [])
        setLoading(false)
    }

    async function addSubject(payload) {
        const { data } = await supabase.from('subjects').insert({ ...payload, user_id: user.id }).select().single()
        if (data) setSubjects(p => [data, ...p])
    }

    async function deleteSubject(id) {
        if (!window.confirm('Delete this subject? All its chat sessions will also be removed.')) return
        await supabase.from('subjects').delete().eq('id', id)
        setSubjects(p => p.filter(s => s.id !== id))
    }

    if (loading) return (
        <div className="page-container">
            <div className="subjects-skeleton">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" style={{ height: 130 }} />)}
            </div>
        </div>
    )

    return (
        <div className="page-container animate-fade-in">
            <SubjectModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={addSubject} />

            {subjects.length === 0 ? (
                <div className="subjects-empty glass-card">
                    <div className="subjects-empty-icon">📚</div>
                    <h3>No subjects yet</h3>
                    <p>Add your first subject to get started with organized AI study sessions</p>
                    <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                        <Plus size={15} /> Add Your First Subject
                    </button>
                </div>
            ) : (
                <>
                    <div className="subjects-header">
                        <p className="subjects-count">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
                        <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
                            <Plus size={14} /> Add Subject
                        </button>
                    </div>
                    <div className="subjects-grid">
                        {subjects.map(sub => (
                            <div
                                key={sub.id}
                                className="subject-card glass-card"
                                style={{ '--subject-color': sub.color }}
                                onClick={() => navigate(`/subjects/${sub.id}`)}
                            >
                                <div className="subject-card-top">
                                    <div className="subject-icon" style={{ background: `${sub.color}20`, border: `1px solid ${sub.color}40` }}>
                                        <span style={{ fontSize: 28 }}>{sub.icon}</span>
                                    </div>
                                    <button
                                        className="subject-delete"
                                        onClick={e => { e.stopPropagation(); deleteSubject(sub.id) }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="subject-card-body">
                                    <h3 className="subject-name">{sub.name}</h3>
                                    <div className="subject-sections">
                                        {['Tutorial', 'Assignment', 'Homework'].map(s => (
                                            <span key={s} className="subject-section-tag">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="subject-card-footer">
                                    <span>Open subject</span>
                                    <ChevronRight size={14} />
                                </div>
                                <div className="subject-color-strip" style={{ background: sub.color }} />
                            </div>
                        ))}
                    </div>
                </>
            )}

            <style>{`
        .subjects-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .subjects-count { font-size: 14px; color: var(--text-3); }
        .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
        .subject-card {
          cursor: pointer; padding: 20px; position: relative; overflow: hidden;
          transition: all 0.25s; display: flex; flex-direction: column; gap: 14px;
        }
        .subject-card:hover { transform: translateY(-2px); border-color: var(--subject-color) !important; box-shadow: 0 8px 30px rgba(0,0,0,0.25); }
        .subject-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .subject-icon { width: 60px; height: 60px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .subject-delete { color: var(--text-3); padding: 6px; border-radius: 6px; opacity: 0; transition: all 0.2s; cursor: pointer; }
        .subject-card:hover .subject-delete { opacity: 1; }
        .subject-delete:hover { background: rgba(239,68,68,0.15); color: var(--error); }
        .subject-name { font-size: 16px; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
        .subject-sections { display: flex; flex-wrap: wrap; gap: 4px; }
        .subject-section-tag { font-size: 10px; font-weight: 600; color: var(--text-3); background: var(--glass); border: 1px solid var(--glass-border); border-radius: 99px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .subject-card-footer { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-3); border-top: 1px solid var(--glass-border); padding-top: 12px; }
        .subject-color-strip { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .subjects-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 64px 40px; gap: 16px; }
        .subjects-empty-icon { font-size: 56px; margin-bottom: 4px; }
        .subjects-empty h3 { font-size: 20px; font-weight: 700; }
        .subjects-empty p { color: var(--text-2); font-size: 14px; max-width: 320px; line-height: 1.6; }
        .subjects-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
        .skeleton-card { background: var(--glass); border-radius: var(--radius); animation: pulse 1.5s ease infinite; }
      `}</style>
        </div>
    )
}

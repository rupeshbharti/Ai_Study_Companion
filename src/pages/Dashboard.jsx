import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
    BookOpen, MessageSquare, BarChart3, Flame,
    TrendingUp, Clock, Sparkles, ArrowRight, Plus
} from 'lucide-react'

export default function Dashboard() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({ subjects: 0, sessions: 0, messages: 0, materials: 0 })
    const [recentSessions, setRecentSessions] = useState([])
    const [loading, setLoading] = useState(true)

    const LEVEL_LABELS = {
        high_school: 'High School',
        intermediate: 'Intermediate',
        under_graduation: 'Under Grad',
    }

    useEffect(() => {
        async function load() {
            const [subRes, sesRes, msgRes, matRes, recRes] = await Promise.all([
                supabase.from('subjects').select('id', { count: 'exact', head: true }),
                supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
                supabase.from('messages').select('id', { count: 'exact', head: true }),
                supabase.from('study_materials').select('id', { count: 'exact', head: true }),
                supabase.from('chat_sessions').select('id, title, session_type, created_at, subjects(name, color, icon)').order('created_at', { ascending: false }).limit(4),
            ])
            setStats({
                subjects: subRes.count || 0,
                sessions: sesRes.count || 0,
                messages: msgRes.count || 0,
                materials: matRes.count || 0,
            })
            setRecentSessions(recRes.data || [])
            setLoading(false)
        }
        load()
    }, [])

    const STAT_CARDS = [
        { icon: BookOpen, label: 'Subjects', value: stats.subjects, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
        { icon: MessageSquare, label: 'Chat Sessions', value: stats.sessions, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
        { icon: Flame, label: 'AI Messages', value: stats.messages, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        { icon: BarChart3, label: 'Study Materials', value: stats.materials, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    ]

    const SESSION_TYPE_LABELS = {
        general: 'General Chat',
        tutorial: '📖 Tutorial',
        assignment: '📝 Assignment',
        homework: '✏️ Homework',
    }

    if (loading) return (
        <div className="page-container" style={{ paddingTop: 32 }}>
            <div className="dashboard-skeleton">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
        </div>
    )

    return (
        <div className="page-container animate-fade-in">
            {/* Welcome Banner */}
            <div className="dashboard-banner">
                <div className="dashboard-banner-content">
                    <div className="badge badge-brand" style={{ marginBottom: 10 }}>
                        <Sparkles size={10} /> AI-Powered
                    </div>
                    <h1>
                        Welcome back, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Student'}</span>! 🎓
                    </h1>
                    <p className="dashboard-banner-sub">
                        {LEVEL_LABELS[profile?.education_level] || 'Student'} •{' '}
                        {profile?.education_details?.standard
                            ? `Standard ${profile.education_details.standard}`
                            : profile?.education_details?.grade
                                ? `Class ${profile.education_details.grade}, ${profile.education_details.stream}`
                                : profile?.education_details?.course
                                    ? `${profile.education_details.course} • Year ${profile.education_details.year}`
                                    : 'Set your education profile'
                        }
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <button className="btn btn-primary" onClick={() => navigate('/chat')}>
                            <MessageSquare size={15} /> Ask AI
                        </button>
                        <button className="btn btn-ghost" onClick={() => navigate('/subjects')}>
                            <BookOpen size={15} /> My Subjects
                        </button>
                    </div>
                </div>
                <div className="dashboard-banner-orb" />
            </div>

            {/* Stats */}
            <div className="stat-grid">
                {STAT_CARDS.map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="stat-card glass-card">
                        <div className="stat-icon" style={{ background: bg, color }}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <p className="stat-value">{value}</p>
                            <p className="stat-label">{label}</p>
                        </div>
                        <TrendingUp size={14} className="stat-trend" style={{ color }} />
                    </div>
                ))}
            </div>

            {/* Quick Actions + Recent Activity */}
            <div className="dashboard-grid">
                {/* Quick Actions */}
                <div className="glass-card dashboard-section">
                    <h2 className="section-title"><Sparkles size={16} /> Quick Actions</h2>
                    <div className="quick-actions">
                        {[
                            { label: 'Start AI Chat', desc: 'General study help', icon: MessageSquare, color: '#6366f1', to: '/chat' },
                            { label: 'Add Subject', desc: 'Organize your studies', icon: BookOpen, color: '#22c55e', to: '/subjects' },
                            { label: 'Upload Material', desc: 'PDF, images, docs', icon: BarChart3, color: '#f59e0b', to: '/library' },
                            { label: 'View Insights', desc: 'Track progress', icon: Flame, color: '#3b82f6', to: '/insights' },
                        ].map(({ label, desc, icon: Icon, color, to }) => (
                            <button
                                key={label}
                                className="quick-action-card"
                                onClick={() => navigate(to)}
                            >
                                <div className="quick-action-icon" style={{ background: `${color}20`, color }}>
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <p className="quick-action-label">{label}</p>
                                    <p className="quick-action-desc">{desc}</p>
                                </div>
                                <ArrowRight size={14} className="quick-action-arrow" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Sessions */}
                <div className="glass-card dashboard-section">
                    <div className="section-title-row">
                        <h2 className="section-title"><Clock size={16} /> Recent Sessions</h2>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/subjects')}>
                            View all
                        </button>
                    </div>
                    {recentSessions.length === 0 ? (
                        <div className="empty-state">
                            <p>No sessions yet. Start chatting!</p>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/chat')}>
                                <Plus size={13} /> Start Chat
                            </button>
                        </div>
                    ) : (
                        <div className="recent-sessions">
                            {recentSessions.map(s => (
                                <div key={s.id} className="recent-session-item">
                                    <div className="recent-session-dot" style={{ background: s.subjects?.color || '#6366f1' }} />
                                    <div className="recent-session-info">
                                        <p className="recent-session-title">
                                            {s.subjects?.icon} {s.subjects?.name || 'General Chat'}
                                        </p>
                                        <p className="recent-session-type">{SESSION_TYPE_LABELS[s.session_type] || s.session_type}</p>
                                    </div>
                                    <p className="recent-session-time">
                                        {new Date(s.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .dashboard-banner {
          position: relative;
          background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06));
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: var(--radius-lg);
          padding: 32px;
          margin-bottom: 28px;
          overflow: hidden;
        }
        .dashboard-banner h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; }
        .dashboard-banner-sub { color: var(--text-2); font-size: 14px; }
        .dashboard-banner-orb {
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { display: flex; align-items: center; gap: 14px; padding: 18px 20px; }
        .stat-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-value { font-size: 22px; font-weight: 800; color: var(--text-1); line-height: 1; }
        .stat-label { font-size: 12px; color: var(--text-3); margin-top: 3px; }
        .stat-trend { margin-left: auto; opacity: 0.6; }
        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .dashboard-section { padding: 24px; }
        .section-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; margin-bottom: 16px; }
        .section-title svg { color: var(--brand-from); }
        .section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .section-title-row .section-title { margin-bottom: 0; }
        .quick-actions { display: flex; flex-direction: column; gap: 8px; }
        .quick-action-card {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; border-radius: 10px;
          background: var(--glass); border: 1px solid var(--glass-border);
          cursor: pointer; transition: all 0.2s; text-align: left; width: 100%;
        }
        .quick-action-card:hover { background: var(--glass-hover); border-color: var(--glass-border-hover); }
        .quick-action-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .quick-action-label { font-size: 13px; font-weight: 600; color: var(--text-1); }
        .quick-action-desc { font-size: 11px; color: var(--text-3); margin-top: 1px; }
        .quick-action-arrow { margin-left: auto; color: var(--text-3); opacity: 0; transition: all 0.2s; }
        .quick-action-card:hover .quick-action-arrow { opacity: 1; transform: translateX(3px); }
        .recent-sessions { display: flex; flex-direction: column; gap: 10px; }
        .recent-session-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; background: var(--glass); }
        .recent-session-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .recent-session-info { flex: 1; min-width: 0; }
        .recent-session-title { font-size: 13px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .recent-session-type { font-size: 11px; color: var(--text-3); margin-top: 1px; }
        .recent-session-time { font-size: 11px; color: var(--text-3); white-space: nowrap; }
        .empty-state { text-align: center; padding: 32px 0; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-state p { color: var(--text-3); font-size: 14px; }
        .dashboard-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .skeleton-card { height: 90px; background: var(--glass); border-radius: var(--radius); animation: pulse 1.5s ease infinite; }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        @media (max-width: 1024px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } .dashboard-grid { grid-template-columns: 1fr; } }
      `}</style>
        </div>
    )
}

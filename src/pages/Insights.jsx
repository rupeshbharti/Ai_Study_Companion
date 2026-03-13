import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, BookOpen, Flame, BarChart3, TrendingUp, Zap } from 'lucide-react'

function StatRing({ value, max, color, label }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    const r = 36, circ = 2 * Math.PI * r
    const offset = circ - (pct / 100) * circ

    return (
        <div className="stat-ring-wrap">
            <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={r} fill="none" stroke="var(--glass-border)" strokeWidth="7" />
                <circle
                    cx="45" cy="45" r={r}
                    fill="none" stroke={color} strokeWidth="7"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 45 45)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <text x="45" y="49" textAnchor="middle" fill="var(--text-1)" fontSize="15" fontWeight="700">{value}</text>
            </svg>
            <p className="stat-ring-label">{label}</p>
        </div>
    )
}

export default function Insights() {
    const { profile } = useAuth()
    const [data, setData] = useState(null)
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [subRes, sesRes, userMsgRes, aiMsgRes, matRes, sesListRes] = await Promise.all([
                supabase.from('subjects').select('id', { count: 'exact', head: true }),
                supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
                supabase.from('messages').select('id', { count: 'exact', head: true }).eq('role', 'user'),
                supabase.from('messages').select('id', { count: 'exact', head: true }).eq('role', 'assistant'),
                supabase.from('study_materials').select('id', { count: 'exact', head: true }),
                supabase.from('chat_sessions').select('id, session_type, created_at').order('created_at', { ascending: false }).limit(20),
            ])

            const aiMessages = aiMsgRes.count || 0
            const userMessages = userMsgRes.count || 0

            setData({
                subjects: subRes.count || 0,
                sessions: sesRes.count || 0,
                messages: (aiMessages + userMessages),
                aiMessages,
                userMessages,
                materials: matRes.count || 0,
            })

            const typeCounts = {}
            sesListRes.data?.forEach(s => { typeCounts[s.session_type] = (typeCounts[s.session_type] || 0) + 1 })
            setSessions(typeCounts)
            setLoading(false)
        }
        load()
    }, [])

    const LEVEL_LABELS = {
        high_school: 'High School',
        intermediate: 'Intermediate',
        under_graduation: 'Under Graduation',
    }

    if (loading) return (
        <div className="page-container">
            <div className="insights-skeleton">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" style={{ height: 160 }} />)}
            </div>
        </div>
    )

    const SESSION_TYPE_COLORS = {
        general: '#6366f1',
        tutorial: '#22c55e',
        assignment: '#f59e0b',
        homework: '#3b82f6',
    }

    const totalSessByType = Object.values(sessions).reduce((a, b) => a + b, 0) || 1

    return (
        <div className="page-container animate-fade-in">
            {/* Profile card */}
            <div className="insights-profile glass-card">
                <div className="insights-profile-left">
                    <div className="insights-avatar">
                        {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </div>
                    <div>
                        <h2>{profile?.full_name || 'Student'}</h2>
                        <p className="insights-level">{LEVEL_LABELS[profile?.education_level] || 'Not configured'}</p>
                        {profile?.education_details?.course && <p className="insights-detail">{profile.education_details.course} · Year {profile.education_details.year}</p>}
                        {profile?.education_details?.standard && <p className="insights-detail">Standard {profile.education_details.standard}</p>}
                        {profile?.education_details?.grade && <p className="insights-detail">Class {profile.education_details.grade} · {profile.education_details.stream}</p>}
                    </div>
                </div>
                <div className="insights-badge">
                    <Zap size={16} /> AI Active
                </div>
            </div>

            {/* Ring Stats */}
            <div className="glass-card insights-rings-card">
                <h3 className="insights-section-title"><BarChart3 size={16} /> Study Overview</h3>
                <div className="insights-rings">
                    <StatRing value={data.subjects} max={20} color="#6366f1" label="Subjects" />
                    <StatRing value={data.sessions} max={100} color="#22c55e" label="Sessions" />
                    <StatRing value={data.aiMessages} max={500} color="#f59e0b" label="AI Replies" />
                    <StatRing value={data.userMessages} max={500} color="#3b82f6" label="My Questions" />
                    <StatRing value={data.materials} max={50} color="#ec4899" label="Materials" />
                </div>
            </div>

            {/* Session Types */}
            <div className="insights-grid">
                <div className="glass-card insights-card">
                    <h3 className="insights-section-title"><MessageSquare size={16} /> Sessions by Type</h3>
                    {Object.keys(SESSION_TYPE_COLORS).map(type => {
                        const count = sessions[type] || 0
                        const pct = Math.round((count / totalSessByType) * 100)
                        return (
                            <div key={type} className="session-bar-item">
                                <div className="session-bar-label">
                                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                    <span>{count}</span>
                                </div>
                                <div className="session-bar-track">
                                    <div
                                        className="session-bar-fill"
                                        style={{ width: `${pct}%`, background: SESSION_TYPE_COLORS[type] }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="glass-card insights-card">
                    <h3 className="insights-section-title"><TrendingUp size={16} /> Key Metrics</h3>
                    {[
                        { label: 'Total Messages', value: data.messages, icon: MessageSquare, color: '#6366f1' },
                        { label: 'AI Responses', value: data.aiMessages, icon: Flame, color: '#f59e0b' },
                        { label: 'Chat Sessions', value: data.sessions, icon: BookOpen, color: '#22c55e' },
                        { label: 'Study Files', value: data.materials, icon: BarChart3, color: '#3b82f6' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="metric-item">
                            <div className="metric-icon" style={{ background: `${color}20`, color }}>
                                <Icon size={15} />
                            </div>
                            <p className="metric-label">{label}</p>
                            <p className="metric-value" style={{ color }}>{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        .insights-profile {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
        }
        .insights-profile-left { display: flex; align-items: center; gap: 16px; }
        .insights-avatar {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .insights-profile h2 { font-size: 18px; font-weight: 700; }
        .insights-level { font-size: 13px; color: var(--brand-from); margin-top: 3px; font-weight: 600; }
        .insights-detail { font-size: 12px; color: var(--text-3); margin-top: 2px; }
        .insights-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 99px;
          font-size: 13px; font-weight: 600; color: var(--brand-from);
        }
        .insights-rings-card { padding: 24px; margin-bottom: 20px; }
        .insights-section-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; margin-bottom: 20px; }
        .insights-section-title svg { color: var(--brand-from); }
        .insights-rings { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
        .stat-ring-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .stat-ring-label { font-size: 11px; color: var(--text-3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .insights-card { padding: 24px; }
        .session-bar-item { margin-bottom: 14px; }
        .session-bar-label { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-2); margin-bottom: 6px; font-weight: 500; }
        .session-bar-track { height: 6px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
        .session-bar-fill { height: 100%; border-radius: 99px; transition: width 1s ease; }
        .metric-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .metric-item:last-child { border-bottom: none; }
        .metric-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .metric-label { flex: 1; font-size: 13px; color: var(--text-2); }
        .metric-value { font-size: 16px; font-weight: 800; }
        .insights-skeleton { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (max-width: 768px) { .insights-grid { grid-template-columns: 1fr; } }
      `}</style>
        </div>
    )
}

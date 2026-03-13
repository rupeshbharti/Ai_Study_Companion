import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useGeminiChat } from '../hooks/useGeminiChat'
import ChatWindow from '../components/chat/ChatWindow'
import { BookOpen, PenLine, FileQuestion, Library as LibraryIcon } from 'lucide-react'

const SECTION_TABS = [
    { id: 'tutorial', label: 'Tutorial', icon: BookOpen, desc: 'Learn concepts with AI guidance' },
    { id: 'assignment', label: 'Assignment', icon: PenLine, desc: 'Get hints without direct answers' },
    { id: 'homework', label: 'Homework', icon: FileQuestion, desc: 'Step-by-step solution walkthrough' },
]

function useChatSession(subjectId, sectionType, user) {
    const [sessionId, setSessionId] = useState(null)

    useEffect(() => {
        if (!subjectId || !sectionType || !user) return
        setSessionId(null)
        async function getOrCreate() {
            const { data: existing } = await supabase
                .from('chat_sessions')
                .select('id')
                .eq('subject_id', subjectId)
                .eq('session_type', sectionType)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (existing) {
                setSessionId(existing.id)
            } else {
                const { data: created } = await supabase
                    .from('chat_sessions')
                    .insert({ subject_id: subjectId, session_type: sectionType, user_id: user.id, title: `${sectionType} session` })
                    .select('id')
                    .single()
                if (created) setSessionId(created.id)
            }
        }
        getOrCreate()
    }, [subjectId, sectionType, user])

    return sessionId
}

export default function SubjectDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [subject, setSubject] = useState(null)
    const [materialsCount, setMaterialsCount] = useState(0)
    const [activeTab, setActiveTab] = useState('tutorial')

    const sessionId = useChatSession(id, activeTab, user)
    const chatHook = useGeminiChat(sessionId, {
        subjectName: subject?.name,
        sectionType: activeTab,
        sessionId,
    })

    useEffect(() => {
        supabase.from('subjects').select('*').eq('id', id).single().then(({ data }) => setSubject(data))
        supabase.from('study_materials').select('id', { count: 'exact' }).eq('subject_id', id).then(({ count }) => setMaterialsCount(count || 0))
    }, [id])

    if (!subject) return (
        <div className="subject-detail-page">
            <div className="subject-detail-loading">
                <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        </div>
    )

    return (
        <div className="subject-detail-page">
            {/* Subject header */}
            <div className="subject-detail-header">
                <div className="subject-detail-icon" style={{ background: `${subject.color}20`, border: `1px solid ${subject.color}40` }}>
                    <span style={{ fontSize: 28 }}>{subject.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                    <h1 className="subject-detail-title">{subject.name}</h1>
                    <p className="subject-detail-sub" style={{ color: subject.color }}>
                        AI Study Assistant Active
                    </p>
                </div>
                <button
                    className="subject-materials-btn"
                    onClick={() => navigate('/library')}
                    title="View uploaded materials for this subject"
                >
                    <LibraryIcon size={16} />
                    <span>{materialsCount} Material{materialsCount !== 1 ? 's' : ''}</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="subject-tabs">
                {SECTION_TABS.map(({ id: tabId, label, icon: Icon, desc }) => (
                    <button
                        key={tabId}
                        className={`subject-tab ${activeTab === tabId ? 'active' : ''}`}
                        style={activeTab === tabId ? { '--tab-color': subject.color } : {}}
                        onClick={() => setActiveTab(tabId)}
                    >
                        <Icon size={15} />
                        <div>
                            <p className="subject-tab-label">{label}</p>
                            <p className="subject-tab-desc">{desc}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Chat */}
            <div className="subject-chat-container">
                {sessionId ? (
                    <ChatWindow
                        hook={chatHook}
                        context={{ subjectName: subject.name, sectionType: activeTab, sessionId }}
                        title={`${subject.icon} ${subject.name} — ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                        subtitle={SECTION_TABS.find(t => t.id === activeTab)?.desc}
                    />
                ) : (
                    <div className="subject-chat-loading">
                        <span className="spinner" />
                        <p>Initializing chat session…</p>
                    </div>
                )}
            </div>

            <style>{`
        .subject-detail-page {
          height: calc(100vh - var(--topbar-h));
          display: flex;
          flex-direction: column;
          padding: 20px 28px 0;
          gap: 16px;
          overflow: hidden;
        }
        .subject-detail-loading { flex: 1; display: flex; align-items: center; justify-content: center; }
        .subject-detail-header { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
        .subject-detail-icon { width: 60px; height: 60px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .subject-detail-title { font-size: 22px; font-weight: 800; color: var(--text-1); }
        .subject-detail-sub { font-size: 13px; display: flex; align-items: center; gap: 5px; margin-top: 3px; font-weight: 500; }
        .subject-materials-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px;
          border-radius: 10px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          color: var(--text-2);
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .subject-materials-btn:hover { background: var(--glass-hover); color: var(--text-1); border-color: var(--glass-border-hover); }
        .subject-tabs { display: flex; gap: 10px; flex-shrink: 0; overflow-x: auto; padding-bottom: 4px; }
        .subject-tab {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 18px;
          border-radius: 12px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          color: var(--text-2);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          min-width: 0;
        }
        .subject-tab:hover { background: var(--glass-hover); color: var(--text-1); }
        .subject-tab.active {
          background: rgba(99,102,241,0.12);
          border-color: var(--tab-color, var(--brand-from));
          color: var(--text-1);
        }
        .subject-tab.active svg { color: var(--tab-color, var(--brand-from)); }
        .subject-tab-label { font-size: 13px; font-weight: 600; text-align: left; }
        .subject-tab-desc { font-size: 11px; color: var(--text-3); margin-top: 2px; text-align: left; }
        .subject-chat-container {
          flex: 1;
          overflow: hidden;
          margin-bottom: 20px;
          padding: 0;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          transition: border-color var(--duration) var(--ease), background var(--duration) var(--ease), box-shadow var(--duration) var(--ease);
        }
        .subject-chat-container:hover {
          background: var(--glass-hover);
          border-color: var(--glass-border-hover);
          box-shadow: 0 0 20px rgba(99,102,241,0.08);
        }
        .subject-chat-loading { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; color: var(--text-3); font-size: 14px; }
      `}</style>
        </div>
    )
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useGeminiChat } from '../hooks/useGeminiChat'
import ChatWindow from '../components/chat/ChatWindow'

export default function AIChat() {
    const { user } = useAuth()
    const [sessionId, setSessionId] = useState(null)

    useEffect(() => {
        if (!user) return
        async function getOrCreate() {
            const { data: existing } = await supabase
                .from('chat_sessions')
                .select('id')
                .eq('user_id', user.id)
                .eq('session_type', 'general')
                .is('subject_id', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (existing) {
                setSessionId(existing.id)
            } else {
                const { data: created } = await supabase
                    .from('chat_sessions')
                    .insert({ user_id: user.id, session_type: 'general', title: 'General Chat' })
                    .select('id')
                    .single()
                if (created) setSessionId(created.id)
            }
        }
        getOrCreate()
    }, [user])

    const chatHook = useGeminiChat(sessionId, {})

    return (
        <div className="aichat-page">
            {sessionId ? (
                <ChatWindow
                    hook={chatHook}
                    context={{ sessionId }}
                    title="AI Study Assistant"
                    subtitle="Ask me anything — I'll adapt to your education level"
                />
            ) : (
                <div className="aichat-loading">
                    <span className="spinner" style={{ width: 32, height: 32 }} />
                    <p>Starting your session…</p>
                </div>
            )}

            <style>{`
        .aichat-page {
          height: calc(100vh - var(--topbar-h));
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .aichat-loading {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          color: var(--text-3);
          font-size: 14px;
        }
      `}</style>
        </div>
    )
}

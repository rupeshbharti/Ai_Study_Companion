import { useState, useCallback, useRef } from 'react'
import { supabase, SUPABASE_URL } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { v4 as uuidv4 } from 'uuid'

const PRIMARY_GEMINI_MODEL = 'gemini-2.5-flash'
const FALLBACK_GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash']

export function useGeminiChat(sessionId, context = {}) {
    const [messages, setMessages] = useState([])
    const [streaming, setStreaming] = useState(false)
    const [streamingText, setStreamingText] = useState('')
    const [error, setError] = useState(null)
    const { session } = useAuth()
    // Ref so sendMessage always has the latest messages without being in its dep array
    const messagesRef = useRef([])

    const loadMessages = useCallback(async () => {
        if (!sessionId) return
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
        if (data) {
            setMessages(data)
            messagesRef.current = data
        }
    }, [sessionId])

    const sendMessage = useCallback(async (content, attachments = []) => {
        if (!session || !sessionId || !content.trim()) return
        setError(null)
        setStreaming(true)
        setStreamingText('')

        const userMsg = {
            id: uuidv4(),
            session_id: sessionId,
            user_id: session.user.id,
            role: 'user',
            content,
            attachments,
            created_at: new Date().toISOString(),
        }
        setMessages(prev => {
            const next = [...prev, userMsg]
            messagesRef.current = next
            return next
        })

        // Save user message to Supabase
        await supabase.from('messages').insert({
            session_id: sessionId,
            user_id: session.user.id,
            role: 'user',
            content,
            attachments,
        })

        try {
            // Always get a fresh session before calling the Edge Function.
            // The Supabase client auto-refreshes for REST calls, but raw fetch() does not —
            // so we must refresh manually here to avoid 401 from an expired token.
            const { data: freshSessionData } = await supabase.auth.getSession()
            const freshToken = freshSessionData?.session?.access_token
            if (!freshToken) throw new Error('Session expired. Please sign in again.')

            const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${freshToken}`,
                },
                body: JSON.stringify({
                    message: content,
                    chatHistory: messagesRef.current,
                    subjectName: context.subjectName,
                    sectionType: context.sectionType,
                    attachments,
                    model: PRIMARY_GEMINI_MODEL,
                    fallbackModels: FALLBACK_GEMINI_MODELS,
                }),
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData.error || `HTTP ${response.status}`)
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullResponse = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                fullResponse += chunk
                setStreamingText(fullResponse)
            }

            // Save assistant response to Supabase
            const { data: savedMsg } = await supabase.from('messages').insert({
                session_id: sessionId,
                user_id: session.user.id,
                role: 'assistant',
                content: fullResponse,
            }).select().single()

            setMessages(prev => {
                const next = [...prev, savedMsg || {
                    id: uuidv4(),
                    role: 'assistant',
                    content: fullResponse,
                    created_at: new Date().toISOString(),
                }]
                messagesRef.current = next
                return next
            })
        } catch (err) {
            const message = err?.message || 'Unknown error'
            const isLikelyModelError =
                /model|not found|unsupported|invalid argument|resource_exhausted|permission/i.test(message)
            const errorText = isLikelyModelError
                ? `${message}. Check Supabase Edge Function model config (recommended: ${PRIMARY_GEMINI_MODEL}).`
                : message

            setError(errorText)
            const errMsg = {
                id: uuidv4(),
                role: 'assistant',
                content: `Error: ${errorText}`,
                created_at: new Date().toISOString(),
            }
            setMessages(prev => {
                const next = [...prev, errMsg]
                messagesRef.current = next
                return next
            })
        } finally {
            setStreaming(false)
            setStreamingText('')
        }
    }, [session, sessionId, context])

    return { messages, sendMessage, streaming, streamingText, error, loadMessages, setMessages }
}

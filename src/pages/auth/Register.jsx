import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { BookOpen, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function Register() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ full_name: '', email: '', password: '' })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handle = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

    async function handleRegister(e) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.full_name } },
        })
        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            navigate('/onboarding')
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />

            <div className="auth-card animate-scale-in">
                <div className="auth-logo">
                    <div className="auth-logo-icon"><BookOpen size={28} /></div>
                    <div>
                        <h1 className="auth-logo-title">StudyAI</h1>
                        <p className="auth-logo-sub">AI Companion</p>
                    </div>
                </div>

                <div className="auth-header">
                    <h2>Create your account</h2>
                    <p>Start your AI-powered learning journey today</p>
                </div>

                <form onSubmit={handleRegister} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div className="input-icon-wrap">
                            <User size={16} className="input-icon" />
                            <input
                                type="text"
                                className="form-input input-with-icon"
                                placeholder="Your full name"
                                value={form.full_name}
                                onChange={handle('full_name')}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-icon-wrap">
                            <Mail size={16} className="input-icon" />
                            <input
                                type="email"
                                className="form-input input-with-icon"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handle('email')}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-icon-wrap">
                            <Lock size={16} className="input-icon" />
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="form-input input-with-icon input-with-action"
                                placeholder="Minimum 6 characters"
                                value={form.password}
                                onChange={handle('password')}
                                minLength={6}
                                required
                            />
                            <button type="button" className="input-action" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                        {loading ? <span className="spinner" /> : <><Sparkles size={16} /> Create Account</>}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>

            <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); position: relative; overflow: hidden; padding: 20px; }
        .auth-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; animation: float 6s ease-in-out infinite; }
        .auth-orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%); top: -100px; left: -100px; }
        .auth-orb-2 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); bottom: -80px; right: -80px; animation-delay: -3s; }
        .auth-card { background: var(--glass); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 40px; width: 100%; max-width: 420px; backdrop-filter: blur(20px); position: relative; z-index: 1; }
        .auth-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .auth-logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, var(--brand-from), var(--brand-to)); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
        .auth-logo-title { font-size: 20px; font-weight: 800; line-height: 1; background: linear-gradient(135deg, var(--brand-from), var(--brand-to)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .auth-logo-sub { font-size: 11px; color: var(--text-3); margin-top: 2px; }
        .auth-header { margin-bottom: 24px; }
        .auth-header h2 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .auth-header p { color: var(--text-2); font-size: 14px; }
        .auth-form { display: flex; flex-direction: column; gap: 16px; }
        .auth-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171; padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; }
        .input-icon-wrap { position: relative; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
        .input-with-icon { padding-left: 38px !important; }
        .input-with-action { padding-right: 40px !important; }
        .input-action { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-3); padding: 4px; border-radius: 4px; transition: color 0.15s; }
        .input-action:hover { color: var(--text-1); }
        .auth-footer { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text-2); }
        .auth-footer a { color: var(--brand-from); font-weight: 600; }
        .auth-footer a:hover { color: var(--brand-to); }
      `}</style>
        </div>
    )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, BookOpen, FlaskConical, Briefcase, Palette, ArrowRight, CheckCircle2 } from 'lucide-react'

const EDUCATION_LEVELS = [
    { id: 'high_school', label: 'High School', subtitle: 'Class 5th – 10th', icon: BookOpen, color: '#22c55e' },
    { id: 'intermediate', label: 'Intermediate', subtitle: '11th & 12th Standard', icon: GraduationCap, color: '#f59e0b' },
    { id: 'under_graduation', label: 'Under Graduation', subtitle: 'B.Tech, BCA, B.Com, BA, etc.', icon: FlaskConical, color: '#6366f1' },
]

const STREAMS = ['Science', 'Commerce', 'Arts']
const UG_COURSES = ['B.Tech', 'BCA', 'B.Sc (CS)', 'B.Sc (Science)', 'B.Com', 'BBA', 'BA', 'MBBS', 'B.Pharmacy', 'Other']
const STANDARDS = ['5', '6', '7', '8', '9', '10']
const GRADES = ['11', '12']

export default function Onboarding() {
    const { user, refreshProfile } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [level, setLevel] = useState('')
    const [details, setDetails] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const det = k => v => setDetails(d => ({ ...d, [k]: v }))

    async function handleComplete() {
        setLoading(true)
        setError('')
        const { error } = await supabase
            .from('profiles')
            .update({
                education_level: level,
                education_details: details,
                onboarding_completed: true,
            })
            .eq('id', user.id)
        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            await refreshProfile()
            navigate('/')
        }
    }

    return (
        <div className="onboard-page">
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />

            <div className="onboard-card animate-fade-in">
                {/* Progress */}
                <div className="onboard-progress">
                    <div className="onboard-step-dots">
                        {[1, 2].map(s => (
                            <div key={s} className={`onboard-dot ${step >= s ? 'active' : ''}`} />
                        ))}
                    </div>
                    <span className="onboard-step-label">Step {step} of 2</span>
                </div>

                {/* Step 1 — Choose education level */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="onboard-header">
                            <GraduationCap size={36} className="onboard-icon" />
                            <h2>What's your education level?</h2>
                            <p>AI will adapt its response style based on your level</p>
                        </div>
                        <div className="level-grid">
                            {EDUCATION_LEVELS.map(lv => {
                                const Icon = lv.icon
                                return (
                                    <button
                                        key={lv.id}
                                        className={`level-card ${level === lv.id ? 'selected' : ''}`}
                                        onClick={() => setLevel(lv.id)}
                                        style={{ '--level-color': lv.color }}
                                    >
                                        <div className="level-icon" style={{ background: `${lv.color}20`, color: lv.color }}>
                                            <Icon size={22} />
                                        </div>
                                        <div className="level-info">
                                            <strong>{lv.label}</strong>
                                            <span>{lv.subtitle}</span>
                                        </div>
                                        {level === lv.id && <CheckCircle2 size={18} className="level-check" style={{ color: lv.color }} />}
                                    </button>
                                )
                            })}
                        </div>
                        <button
                            className="btn btn-primary btn-full btn-lg"
                            onClick={() => setStep(2)}
                            disabled={!level}
                            style={{ marginTop: 24 }}
                        >
                            Continue <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {/* Step 2 — Education details */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="onboard-header">
                            <BookOpen size={36} className="onboard-icon" />
                            <h2>Tell us more about your studies</h2>
                            <p>This helps us build an AI tutor just for you</p>
                        </div>

                        <div className="onboard-form">
                            {error && <div className="auth-error">{error}</div>}

                            {level === 'high_school' && (
                                <div className="form-group">
                                    <label className="form-label">Which Standard are you in?</label>
                                    <div className="std-grid">
                                        {STANDARDS.map(s => (
                                            <button
                                                key={s}
                                                className={`std-btn ${details.standard === s ? 'active' : ''}`}
                                                onClick={() => det('standard')(s)}
                                            >
                                                {s}th
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {level === 'intermediate' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Class</label>
                                        <div className="std-grid">
                                            {GRADES.map(g => (
                                                <button
                                                    key={g}
                                                    className={`std-btn ${details.grade === g ? 'active' : ''}`}
                                                    onClick={() => det('grade')(g)}
                                                >
                                                    {g}th
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Stream</label>
                                        <div className="stream-grid">
                                            {STREAMS.map(st => {
                                                const icons = { Science: FlaskConical, Commerce: Briefcase, Arts: Palette }
                                                const Icon = icons[st]
                                                return (
                                                    <button
                                                        key={st}
                                                        className={`stream-btn ${details.stream === st ? 'active' : ''}`}
                                                        onClick={() => det('stream')(st)}
                                                    >
                                                        <Icon size={18} />
                                                        {st}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}

                            {level === 'under_graduation' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Course / Degree</label>
                                        <select
                                            className="form-select"
                                            value={details.course || ''}
                                            onChange={e => det('course')(e.target.value)}
                                        >
                                            <option value="">Select your course</option>
                                            {UG_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label className="form-label">Year</label>
                                            <select
                                                className="form-select"
                                                value={details.year || ''}
                                                onChange={e => det('year')(e.target.value)}
                                            >
                                                <option value="">Year</option>
                                                {['1', '2', '3', '4'].map(y => <option key={y} value={y}>Year {y}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Semester</label>
                                            <select
                                                className="form-select"
                                                value={details.semester || ''}
                                                onChange={e => det('semester')(e.target.value)}
                                            >
                                                <option value="">Sem</option>
                                                {['1', '2', '3', '4', '5', '6', '7', '8'].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                            <button
                                className="btn btn-primary btn-full"
                                onClick={handleComplete}
                                disabled={loading || (
                                    (level === 'high_school' && !details.standard) ||
                                    (level === 'intermediate' && (!details.grade || !details.stream)) ||
                                    (level === 'under_graduation' && (!details.course || !details.year))
                                )}
                            >
                                {loading ? <span className="spinner" /> : <>Start Learning 🚀</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .onboard-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); position: relative; overflow: hidden; padding: 20px; }
        .auth-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; animation: float 6s ease-in-out infinite; }
        .auth-orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%); top: -150px; left: -100px; }
        .auth-orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); bottom: -100px; right: -100px; animation-delay: -3s; }
        .onboard-card { background: var(--glass); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 40px; width: 100%; max-width: 520px; backdrop-filter: blur(20px); position: relative; z-index: 1; }
        .onboard-progress { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .onboard-step-dots { display: flex; gap: 6px; }
        .onboard-dot { width: 32px; height: 4px; border-radius: 99px; background: var(--glass-border); transition: background 0.3s; }
        .onboard-dot.active { background: linear-gradient(90deg, var(--brand-from), var(--brand-to)); }
        .onboard-step-label { font-size: 12px; color: var(--text-3); }
        .onboard-header { text-align: center; margin-bottom: 28px; }
        .onboard-icon { color: var(--brand-from); margin: 0 auto 12px; }
        .onboard-header h2 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
        .onboard-header p { color: var(--text-2); font-size: 14px; }
        .level-grid { display: flex; flex-direction: column; gap: 10px; }
        .level-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: var(--glass); border: 1px solid var(--glass-border); border-radius: var(--radius); cursor: pointer; transition: all 0.2s; text-align: left; }
        .level-card:hover { border-color: var(--level-color, var(--brand-from)); background: var(--glass-hover); }
        .level-card.selected { border-color: var(--level-color, var(--brand-from)); background: rgba(99,102,241,0.07); }
        .level-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .level-info { flex: 1; }
        .level-info strong { display: block; font-size: 14px; font-weight: 600; color: var(--text-1); }
        .level-info span { font-size: 12px; color: var(--text-2); }
        .level-check { flex-shrink: 0; }
        .onboard-form { display: flex; flex-direction: column; gap: 16px; }
        .std-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .std-btn { padding: 10px; border-radius: var(--radius-sm); background: var(--glass); border: 1px solid var(--glass-border); color: var(--text-2); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .std-btn:hover { border-color: var(--brand-from); color: var(--text-1); }
        .std-btn.active { background: rgba(99,102,241,0.15); border-color: var(--brand-from); color: var(--text-1); font-weight: 600; }
        .stream-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .stream-btn { padding: 12px 8px; border-radius: var(--radius-sm); background: var(--glass); border: 1px solid var(--glass-border); color: var(--text-2); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .stream-btn:hover { border-color: var(--brand-from); color: var(--text-1); }
        .stream-btn.active { background: rgba(99,102,241,0.15); border-color: var(--brand-from); color: var(--brand-from); font-weight: 600; }
        .auth-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171; padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; }
      `}</style>
        </div>
    )
}

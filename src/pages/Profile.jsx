import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
    Camera, Save, GraduationCap, BookOpen, FlaskConical,
    Briefcase, Palette, CheckCircle2, Loader2, User, Mail, Shield
} from 'lucide-react'

const EDUCATION_LEVELS = [
    { id: 'high_school', label: 'High School', subtitle: 'Class 5th – 10th', icon: BookOpen, color: '#22c55e' },
    { id: 'intermediate', label: 'Intermediate', subtitle: '11th & 12th Standard', icon: GraduationCap, color: '#f59e0b' },
    { id: 'under_graduation', label: 'Under Graduation', subtitle: 'B.Tech, BCA, B.Com, BA, etc.', icon: FlaskConical, color: '#6366f1' },
]

const STREAMS = ['Science', 'Commerce', 'Arts']
const UG_COURSES = ['B.Tech', 'BCA', 'B.Sc (CS)', 'B.Sc (Science)', 'B.Com', 'BBA', 'BA', 'MBBS', 'B.Pharmacy', 'Other']
const STANDARDS = ['5', '6', '7', '8', '9', '10']
const GRADES = ['11', '12']

export default function Profile() {
    const { user, profile, refreshProfile } = useAuth()
    const fileRef = useRef()

    const [fullName, setFullName] = useState(profile?.full_name || '')
    const [level, setLevel] = useState(profile?.education_level || '')
    const [details, setDetails] = useState(profile?.education_details || {})
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    const det = k => v => setDetails(d => ({ ...d, [k]: v }))

    const initials = fullName
        ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?'

    async function handleAvatarUpload(e) {
        const file = e.target.files[0]
        if (!file || !user) return
        setUploading(true)
        setError('')
        try {
            const ext = file.name.split('.').pop()
            const path = `${user.id}/avatar.${ext}`

            // Remove old avatar if exists
            await supabase.storage.from('avatars').remove([path])

            const { error: uploadErr } = await supabase.storage
                .from('avatars')
                .upload(path, file, { upsert: true })
            if (uploadErr) throw uploadErr

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
            // Add cache-buster
            const freshUrl = `${publicUrl}?t=${Date.now()}`
            setAvatarUrl(freshUrl)

            // Save avatar URL immediately to profile
            await supabase.from('profiles').update({ avatar_url: freshUrl }).eq('id', user.id)
            await refreshProfile()
        } catch (err) {
            setError(err.message || 'Avatar upload failed')
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    async function handleSave() {
        setSaving(true)
        setError('')
        setSaved(false)
        try {
            const { error: updateErr } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    education_level: level,
                    education_details: details,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)
            if (updateErr) throw updateErr
            await refreshProfile()
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            setError(err.message || 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="page-container animate-fade-in">
            <div className="profile-page">
                {/* Header */}
                <div className="profile-header glass-card">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-wrapper" onClick={() => fileRef.current.click()}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
                            ) : (
                                <div className="profile-avatar-placeholder">{initials}</div>
                            )}
                            <div className="profile-avatar-overlay">
                                {uploading ? <Loader2 size={20} className="spin-icon" /> : <Camera size={20} />}
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                hidden
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                        <div className="profile-header-info">
                            <h1>{fullName || 'Student'}</h1>
                            <p className="profile-email"><Mail size={13} /> {user?.email}</p>
                            <p className="profile-badge">
                                <Shield size={12} />
                                {EDUCATION_LEVELS.find(l => l.id === level)?.label || 'Not set'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Personal Info */}
                <div className="profile-section glass-card">
                    <h2 className="profile-section-title"><User size={18} /> Personal Information</h2>
                    <div className="profile-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                className="form-input"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                className="form-input"
                                value={user?.email || ''}
                                disabled
                                style={{ opacity: 0.6 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Education Level */}
                <div className="profile-section glass-card">
                    <h2 className="profile-section-title"><GraduationCap size={18} /> Education Level</h2>
                    <p className="profile-section-desc">Update your education level — AI will adapt responses accordingly</p>
                    <div className="level-grid">
                        {EDUCATION_LEVELS.map(lv => {
                            const Icon = lv.icon
                            return (
                                <button
                                    key={lv.id}
                                    className={`level-card ${level === lv.id ? 'selected' : ''}`}
                                    onClick={() => { setLevel(lv.id); setDetails({}) }}
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

                    {/* Education Details */}
                    {level && (
                        <div className="profile-details-form animate-fade-in" style={{ marginTop: 20 }}>
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
                    )}
                </div>

                {/* Error / Save */}
                {error && <div className="profile-error">⚠️ {error}</div>}

                <div className="profile-actions">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleSave}
                        disabled={saving || !fullName.trim()}
                    >
                        {saving ? (
                            <><Loader2 size={16} className="spin-icon" /> Saving…</>
                        ) : saved ? (
                            <><CheckCircle2 size={16} /> Saved!</>
                        ) : (
                            <><Save size={16} /> Save Changes</>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        .profile-page {
          max-width: 640px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 40px;
        }
        .profile-header {
          padding: 28px;
          text-align: center;
        }
        .profile-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .profile-avatar-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          cursor: pointer;
          overflow: hidden;
          flex-shrink: 0;
        }
        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .profile-avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          color: #fff;
        }
        .profile-avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          opacity: 0;
          transition: opacity 0.2s;
          border-radius: 50%;
        }
        .profile-avatar-wrapper:hover .profile-avatar-overlay {
          opacity: 1;
        }
        .profile-header-info h1 {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-1);
        }
        .profile-email {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-3);
          margin-top: 4px;
        }
        .profile-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 99px;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.2);
          color: var(--brand-from);
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
        }
        .profile-section {
          padding: 24px;
        }
        .profile-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-1);
          margin-bottom: 4px;
        }
        .profile-section-desc {
          font-size: 13px;
          color: var(--text-3);
          margin-bottom: 16px;
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 14px;
        }
        .profile-details-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .profile-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
        }
        .profile-actions {
          display: flex;
          justify-content: center;
        }
        .profile-actions .btn {
          min-width: 200px;
        }
        .level-grid { display: flex; flex-direction: column; gap: 10px; }
        .level-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: var(--glass); border: 1px solid var(--glass-border); border-radius: var(--radius); cursor: pointer; transition: all 0.2s; text-align: left; }
        .level-card:hover { border-color: var(--level-color, var(--brand-from)); background: var(--glass-hover); }
        .level-card.selected { border-color: var(--level-color, var(--brand-from)); background: rgba(99,102,241,0.07); }
        .level-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .level-info { flex: 1; }
        .level-info strong { display: block; font-size: 14px; font-weight: 600; color: var(--text-1); }
        .level-info span { font-size: 12px; color: var(--text-2); }
        .level-check { flex-shrink: 0; }
        .std-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .std-btn { padding: 10px; border-radius: var(--radius-sm); background: var(--glass); border: 1px solid var(--glass-border); color: var(--text-2); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .std-btn:hover { border-color: var(--brand-from); color: var(--text-1); }
        .std-btn.active { background: rgba(99,102,241,0.15); border-color: var(--brand-from); color: var(--text-1); font-weight: 600; }
        .stream-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .stream-btn { padding: 12px 8px; border-radius: var(--radius-sm); background: var(--glass); border: 1px solid var(--glass-border); color: var(--text-2); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .stream-btn:hover { border-color: var(--brand-from); color: var(--text-1); }
        .stream-btn.active { background: rgba(99,102,241,0.15); border-color: var(--brand-from); color: var(--brand-from); font-weight: 600; }
        .spin-icon { animation: spin 0.7s linear infinite; }
      `}</style>
        </div>
    )
}

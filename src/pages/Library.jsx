import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Upload, File, Image, FileText, Trash2, BookOpen, Loader2 } from 'lucide-react'

const FILE_ICONS = {
    pdf: <FileText size={20} />,
    image: <Image size={20} />,
    doc: <File size={20} />,
    other: <File size={20} />,
}
const FILE_COLORS = {
    pdf: '#ef4444',
    image: '#22c55e',
    doc: '#3b82f6',
    other: '#f59e0b',
}

export default function Library() {
    const { user } = useAuth()
    const [materials, setMaterials] = useState([])
    const [subjects, setSubjects] = useState([])
    const [uploading, setUploading] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState('')
    const [filterSubject, setFilterSubject] = useState('')
    const [loading, setLoading] = useState(true)
    const [uploadError, setUploadError] = useState('')
    const fileRef = useRef()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const [matRes, subRes] = await Promise.all([
            supabase.from('study_materials').select('*, subjects(name, icon, color)').order('created_at', { ascending: false }),
            supabase.from('subjects').select('id, name, icon'),
        ])
        
        let fetchedMaterials = matRes.data || []
        
        // Generate signed URLs for viewing the private files
        const paths = fetchedMaterials.map(m => m.file_url)
        if (paths.length > 0) {
            const { data: signedUrls, error } = await supabase.storage
                .from('study-materials')
                .createSignedUrls(paths, 3600) // 1 hour validity

            if (!error && signedUrls) {
                fetchedMaterials = fetchedMaterials.map((m, i) => ({
                    ...m,
                    signed_url: signedUrls[i]?.signedUrl || null
                }))
            }
        }
        
        setMaterials(fetchedMaterials)
        setSubjects(subRes.data || [])
        setLoading(false)
    }

    function getFileType(file) {
        if (file.type.startsWith('image/')) return 'image'
        if (file.type === 'application/pdf') return 'pdf'
        if (file.type.includes('word') || file.name.endsWith('.docx')) return 'doc'
        return 'other'
    }

    async function handleUpload(e) {
        const file = e.target.files[0]
        if (!file || !user) return
        setUploading(true)
        setUploadError('')
        try {
            const fileType = getFileType(file)
            const path = `${user.id}/${Date.now()}_${file.name}`

            const { error: storageErr } = await supabase.storage
                .from('study-materials')
                .upload(path, file)

            if (storageErr) throw storageErr

            // Store the path, not the public URL, because it's a private bucket
            await supabase.from('study_materials').insert({
                user_id: user.id,
                subject_id: selectedSubject || null,
                name: file.name,
                file_url: path,
                file_type: fileType,
                file_size: file.size,
            })

            await fetchData()
        } catch (err) {
            console.error('Upload error:', err)
            setUploadError(err.message || 'Upload failed. Please try again.')
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    async function deleteMaterial(id, filePath) {
        if (filePath) await supabase.storage.from('study-materials').remove([filePath])
        await supabase.from('study_materials').delete().eq('id', id)
        setMaterials(p => p.filter(m => m.id !== id))
    }

    function formatSize(bytes) {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }

    const filtered = filterSubject
        ? materials.filter(m => m.subject_id === filterSubject)
        : materials

    if (loading) return (
        <div className="page-container">
            <div className="library-skeleton">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" style={{ height: 80 }} />)}
            </div>
        </div>
    )

    return (
        <div className="page-container animate-fade-in">
            {/* Upload area */}
            <div className="library-upload-area glass-card">
                <div className="library-upload-left">
                    <div className="library-upload-icon"><Upload size={24} /></div>
                    <div>
                        <h3>Upload Study Material</h3>
                        <p>Support: PDF, Images (JPG/PNG), DOCX, TXT — max 50MB</p>
                    </div>
                </div>
                <div className="library-upload-right">
                    <select
                        className="form-select"
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                        style={{ minWidth: 160 }}
                    >
                        <option value="">No subject</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                        ))}
                    </select>
                    <input
                        ref={fileRef}
                        type="file"
                        hidden
                        accept="image/*,.pdf,.docx,.txt"
                        onChange={handleUpload}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => fileRef.current.click()}
                        disabled={uploading}
                    >
                        {uploading ? <><Loader2 size={15} className="spin-icon" /> Uploading…</> : <><Upload size={15} /> Upload File</>}
                    </button>
                </div>
                {uploadError && (
                    <p style={{ width: '100%', color: '#f87171', fontSize: 12, marginTop: 8 }}>⚠️ {uploadError}</p>
                )}
            </div>

            {/* Filter */}
            {subjects.length > 0 && (
                <div className="library-filters">
                    <button
                        className={`filter-btn ${filterSubject === '' ? 'active' : ''}`}
                        onClick={() => setFilterSubject('')}
                    >
                        All Files
                    </button>
                    {subjects.map(s => (
                        <button
                            key={s.id}
                            className={`filter-btn ${filterSubject === s.id ? 'active' : ''}`}
                            onClick={() => setFilterSubject(s.id)}
                        >
                            {s.icon} {s.name}
                        </button>
                    ))}
                </div>
            )}

            {/* File list */}
            {filtered.length === 0 ? (
                <div className="library-empty glass-card">
                    <BookOpen size={40} />
                    <h3>No files yet</h3>
                    <p>Upload your first study material — PDFs, images, or documents</p>
                </div>
            ) : (
                <div className="materials-list">
                    {filtered.map(mat => {
                        const color = FILE_COLORS[mat.file_type] || '#6366f1'
                        return (
                            <div key={mat.id} className="material-item glass-card">
                                <div className="material-icon" style={{ background: `${color}20`, color }}>
                                    {FILE_ICONS[mat.file_type] || FILE_ICONS.other}
                                </div>
                                <div className="material-info">
                                    <p className="material-name">{mat.name}</p>
                                    <div className="material-meta">
                                        {mat.subjects && (
                                            <span className="material-subject">
                                                {mat.subjects.icon} {mat.subjects.name}
                                            </span>
                                        )}
                                        <span>{mat.file_type?.toUpperCase()}</span>
                                        {mat.file_size && <span>{formatSize(mat.file_size)}</span>}
                                        <span>{new Date(mat.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="material-actions">
                                    <a
                                        href={mat.signed_url || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-ghost btn-sm"
                                        onClick={e => !mat.signed_url && e.preventDefault()}
                                    >
                                        Open
                                    </a>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => deleteMaterial(mat.id, mat.file_url)}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <style>{`
        .library-upload-area { display: flex; align-items: center; justify-content: space-between; padding: 24px; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
        .library-upload-left { display: flex; align-items: center; gap: 16px; }
        .library-upload-icon { width: 52px; height: 52px; background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1)); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--brand-from); flex-shrink: 0; }
        .library-upload-left h3 { font-size: 15px; font-weight: 700; margin-bottom: 3px; }
        .library-upload-left p { font-size: 12px; color: var(--text-3); }
        .library-upload-right { display: flex; align-items: center; gap: 10px; }
        .library-filters { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
        .filter-btn { padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 600; background: var(--glass); border: 1px solid var(--glass-border); color: var(--text-2); cursor: pointer; transition: all 0.2s; }
        .filter-btn:hover { border-color: var(--brand-from); color: var(--text-1); }
        .filter-btn.active { background: rgba(99,102,241,0.15); border-color: var(--brand-from); color: var(--text-1); }
        .materials-list { display: flex; flex-direction: column; gap: 10px; }
        .material-item { display: flex; align-items: center; gap: 14px; padding: 16px 20px; }
        .material-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .material-info { flex: 1; min-width: 0; }
        .material-name { font-size: 14px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .material-meta { display: flex; gap: 10px; margin-top: 4px; font-size: 11px; color: var(--text-3); align-items: center; flex-wrap: wrap; }
        .material-subject { background: var(--glass); border: 1px solid var(--glass-border); border-radius: 4px; padding: 1px 6px; }
        .material-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .library-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px; text-align: center; gap: 14px; color: var(--text-3); }
        .library-empty h3 { font-size: 18px; font-weight: 700; color: var(--text-1); }
        .library-empty p { font-size: 14px; max-width: 300px; }
        .library-skeleton { display: flex; flex-direction: column; gap: 10px; }
        .spin-icon { animation: spin 0.7s linear infinite; }
      `}</style>
        </div>
    )
}

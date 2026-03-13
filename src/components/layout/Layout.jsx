import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
    const [addSubjectOpen, setAddSubjectOpen] = useState(false)

    return (
        <div className="app-layout">
            <Sidebar />
            <Topbar onAddSubject={() => setAddSubjectOpen(true)} />
            <main className="main-content">
                <Outlet context={{ addSubjectOpen, setAddSubjectOpen }} />
            </main>
        </div>
    )
}

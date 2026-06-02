import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Package, QrCode, Mic, X, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import VoiceRecorder from './VoiceRecorder.tsx'
import BarcodeScanner from './BarcodeScanner.tsx'

type Props = {
    title: string
    children: React.ReactNode
    showBack?: boolean
}

export default function Layout({ title, children, showBack = false }: Props) {
    const { t } = useTranslation()
    const location = useLocation()
    const navigate = useNavigate()
    const currentPath = location.pathname
    const [recordOpen, setRecordOpen] = useState(false)
    const [scanOpen, setScanOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-950 text-white">

            {/* HEADER */}
            <header className="sticky top-0 z-20 backdrop-blur bg-white/5 ring-1 ring-white/10">
                <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
                    <div className="w-10">
                        {showBack && currentPath !== '/' && (
                            <Link
                                to="/"
                                className="text-xl font-semibold hover:text-indigo-400 transition"
                            >
                                ←
                            </Link>
                        )}
                    </div>

                    <h1 className="text-lg font-semibold text-center truncate">
                        {title}
                    </h1>

                    <div className="w-10" />
                </div>
            </header>

            {/* CONTENT */}
            <main className="pb-24">
                {children}
            </main>

            {/* RECORD MODAL */}
            <div
                className={`fixed inset-0 z-30 ${recordOpen ? '' : 'pointer-events-none'}`}
                aria-hidden={!recordOpen}
            >
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
                        recordOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setRecordOpen(false)}
                />
                <div
                    className={`absolute left-1/2 top-[14%] w-[min(92vw,28rem)] -translate-x-1/2 transition-all ${
                        recordOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('nav.record')}
                >
                    <div className="rounded-2xl bg-slate-950/80 ring-1 ring-white/15 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Mic size={18} className="text-indigo-300" aria-hidden />
                                <div className="text-sm font-semibold">{t('nav.record')}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRecordOpen(false)}
                                className="rounded-lg p-2 text-gray-300 hover:text-white hover:bg-white/10 transition"
                                aria-label={t('products.cancel')}
                            >
                                <X size={18} aria-hidden />
                            </button>
                        </div>
                        <div className="p-5 flex justify-center">
                            <VoiceRecorder />
                        </div>
                    </div>
                </div>
            </div>

            {/* SCAN MODAL */}
            <div
                className={`fixed inset-0 z-30 ${scanOpen ? '' : 'pointer-events-none'}`}
                aria-hidden={!scanOpen}
            >
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
                        scanOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setScanOpen(false)}
                />
                <div
                    className={`absolute left-1/2 top-[10%] w-[min(92vw,32rem)] -translate-x-1/2 transition-all ${
                        scanOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('nav.scan')}
                >
                    <div className="rounded-2xl bg-slate-950/80 ring-1 ring-white/15 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <QrCode size={18} className="text-indigo-300" aria-hidden />
                                <div className="text-sm font-semibold">{t('nav.scan')}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setScanOpen(false)}
                                className="rounded-lg p-2 text-gray-300 hover:text-white hover:bg-white/10 transition"
                                aria-label={t('products.cancel')}
                            >
                                <X size={18} aria-hidden />
                            </button>
                        </div>
                        <div className="p-4">
                            <BarcodeScanner
                                onClose={() => setScanOpen(false)}
                                onScan={(code) => {
                                    setScanOpen(false)
                                    navigate(`/products/${encodeURIComponent(code)}`)
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM NAV */}
            <nav className="fixed inset-x-0 bottom-0 z-20 backdrop-blur bg-white/5 ring-1 ring-white/10">
                <div className="mx-auto max-w-6xl grid grid-cols-5">
                    <NavItem
                        to="/"
                        active={currentPath === '/'}
                        label={t('nav.warehouse')}
                        icon={LayoutDashboard}
                    />
                    <NavItem
                        to="/products"
                        active={currentPath === '/products'}
                        label={t('nav.products')}
                        icon={Package}
                    />
                    <RecordNavButton
                        active={recordOpen}
                        label={t('nav.record')}
                        onClick={() => setRecordOpen(true)}
                    />
                    <ActionNavButton
                        active={scanOpen}
                        label={t('nav.scan')}
                        icon={QrCode}
                        onClick={() => setScanOpen(true)}
                    />
                    <NavItem
                        to="/profile"
                        active={currentPath === '/profile'}
                        label={t('nav.profile')}
                        icon={User}
                    />
                </div>
            </nav>
        </div>
    )
}

/* ---------- nav item ---------- */

function NavItem({
                     to,
                     label,
                     active,
                     icon: Icon,
                 }: {
    to: string
    label: string
    active: boolean
    icon?: LucideIcon
}) {
    return (
        <Link
            to={to}
            className={`flex flex-col items-center gap-1 py-3 text-xs transition
        ${active
                ? 'text-indigo-400'
                : 'text-gray-400 hover:text-white'
            }`}
        >
            <div
                className={`h-6 w-6 flex items-center justify-center rounded-md
          ${active ? 'bg-indigo-500/20' : ''}`}
            >
                {Icon && <Icon size={20} />}
            </div>
            <span>{label}</span>
        </Link>
    )
}

function RecordNavButton({
    active,
    label,
    onClick,
}: {
    active: boolean
    label: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-col items-center py-2.5 text-xs transition text-gray-200"
            aria-label={label}
        >
            <div
                className={`h-12 w-12 flex items-center justify-center rounded-2xl ring-1 transition ${
                    active
                        ? 'bg-indigo-500/30 ring-indigo-400/40 text-indigo-200'
                        : 'bg-indigo-500/20 ring-indigo-400/30 hover:bg-indigo-500/30 text-indigo-200'
                }`}
                style={{ transform: 'translateY(-10px)' }}
            >
                <Mic size={22} aria-hidden />
            </div>
        </button>
    )
}

function ActionNavButton({
    label,
    active,
    icon: Icon,
    onClick,
}: {
    label: string
    active: boolean
    icon: LucideIcon
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center gap-1 py-3 text-xs transition ${
                active ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
            aria-label={label}
        >
            <div className={`h-6 w-6 flex items-center justify-center rounded-md ${active ? 'bg-indigo-500/20' : ''}`}>
                <Icon size={20} aria-hidden />
            </div>
            <span>{label}</span>
        </button>
    )
}

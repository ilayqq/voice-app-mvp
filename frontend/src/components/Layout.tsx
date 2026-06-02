import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Package, QrCode, Loader2, Mic, X, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import BarcodeScanner from './BarcodeScanner.tsx'
import apiClient from '../services/api.ts'
import { openProductCreate } from '../utils/productCreate.ts'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder.ts'

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
    const [scanOpen, setScanOpen] = useState(false)
    const { recording, loading, toggle: toggleRecording } = useVoiceRecorder()

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
                            {scanOpen && (
                                <BarcodeScanner
                                    onClose={() => setScanOpen(false)}
                                    onScan={async (code) => {
                                        setScanOpen(false)
                                        try {
                                            const product = await apiClient.getProductByBarcode(code)
                                            if (product) {
                                                navigate(`/products/${encodeURIComponent(code)}`)
                                            } else {
                                                openProductCreate(code, navigate, currentPath)
                                            }
                                        } catch {
                                            openProductCreate(code, navigate, currentPath)
                                        }
                                    }}
                                />
                            )}
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
                    <ActionNavButton
                        active={recording || loading}
                        recording={recording}
                        loading={loading}
                        label={t('nav.record')}
                        icon={Mic}
                        onClick={toggleRecording}
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
            onClick={e => {
                if (active) e.preventDefault()
            }}
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

function ActionNavButton({
    label,
    active,
    recording = false,
    loading = false,
    icon: Icon,
    onClick,
}: {
    label: string
    active: boolean
    recording?: boolean
    loading?: boolean
    icon: LucideIcon
    onClick: () => void
}) {
    const iconColor = recording
        ? 'text-rose-300'
        : active
            ? 'text-indigo-400'
            : undefined

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className={`flex flex-col items-center gap-1 py-3 text-xs transition disabled:opacity-60 ${
                recording
                    ? 'text-rose-400'
                    : active
                        ? 'text-indigo-400'
                        : 'text-gray-400 hover:text-white'
            }`}
            aria-label={label}
        >
            <div className={`relative h-6 w-6 flex items-center justify-center rounded-md ${
                recording
                    ? 'bg-rose-500/25'
                    : active
                        ? 'bg-indigo-500/20'
                        : ''
            }`}>
                {loading ? (
                    <Loader2 size={20} className="animate-spin text-indigo-300" aria-hidden />
                ) : (
                    <Icon size={20} className={iconColor} aria-hidden />
                )}
                {recording && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-400 animate-pulse" aria-hidden />
                )}
            </div>
            <span>{label}</span>
        </button>
    )
}

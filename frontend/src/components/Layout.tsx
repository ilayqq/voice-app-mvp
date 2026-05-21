import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Props = {
    title: string
    children: React.ReactNode
    showBack?: boolean
}

export default function Layout({ title, children, showBack = false }: Props) {
    const { t } = useTranslation()
    const location = useLocation()
    const currentPath = location.pathname

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
                    <NavItem
                        to="/incoming"
                        active={currentPath === '/incoming'}
                        label={t('nav.incoming')}
                        icon={ArrowDownToLine}
                    />
                    <NavItem
                        to="/outgoing"
                        active={currentPath === '/outgoing'}
                        label={t('nav.outgoing')}
                        icon={ArrowUpFromLine}
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

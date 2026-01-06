'use client'

import Link from 'next/link'
import {
    FileText,
    Building2,
    Truck,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
} from 'lucide-react'

const reports = [
    {
        id: 'daily-program-summary',
        title: 'Daily Program Summary',
        description: 'View planned vs served liters, runs completed, and exception counts per program',
        icon: FileText,
        href: '/reports/daily-program-summary',
        color: 'bg-blue-500',
    },
    {
        id: 'station-ledger',
        title: 'Station Delivery Ledger',
        description: 'Track all deliveries per station with DR/POD references and completeness',
        icon: Building2,
        href: '/reports/station-ledger',
        color: 'bg-green-500',
    },
    {
        id: 'run-liquidation',
        title: 'Dispatch Run Liquidation',
        description: 'Detailed uplift, drop, and heel totals per run with variance tracking',
        icon: Truck,
        href: '/reports/run-liquidation',
        color: 'bg-purple-500',
    },
    {
        id: 'exceptions',
        title: 'Exceptions Register',
        description: 'Monitor all gain/loss variances and missing PODs with clearing status',
        icon: AlertCircle,
        href: '/reports/exceptions',
        color: 'bg-red-500',
    },
    {
        id: 'pod-completeness',
        title: 'POD Completeness',
        description: 'Analyze POD attachment rates by date, station, porter, or tanker',
        icon: CheckCircle2,
        href: '/reports/pod-completeness',
        color: 'bg-orange-500',
    },
    {
        id: 'productivity',
        title: 'Productivity Summary',
        description: 'Operational KPIs: runs, liters delivered, and efficiency metrics',
        icon: TrendingUp,
        href: '/reports/productivity',
        color: 'bg-teal-500',
    },
]

export default function ReportsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        Reports & Analytics
                    </h1>
                    <p className="text-lg text-gray-600">
                        Comprehensive visibility into daily operations, deliveries, and performance metrics
                    </p>
                </div>

                {/* Report Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => {
                        const Icon = report.icon
                        return (
                            <Link
                                key={report.id}
                                href={report.href}
                                className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                            >
                                {/* Color accent bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1 ${report.color}`} />

                                <div className="p-6">
                                    {/* Icon */}
                                    <div className={`inline-flex p-3 rounded-lg ${report.color} bg-opacity-10 mb-4`}>
                                        <Icon className={`h-6 w-6 ${report.color.replace('bg-', 'text-')}`} />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {report.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {report.description}
                                    </p>

                                    {/* Arrow indicator */}
                                    <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                                        View Report
                                        <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* Quick Stats (Optional) */}
                <div className="mt-12 bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">--</div>
                            <div className="text-sm text-gray-600">Active Programs</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">--</div>
                            <div className="text-sm text-gray-600">Completed Runs</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">--</div>
                            <div className="text-sm text-gray-600">Pending PODs</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">--</div>
                            <div className="text-sm text-gray-600">Open Exceptions</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

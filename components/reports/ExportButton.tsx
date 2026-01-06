'use client'

import { Download } from 'lucide-react'
import { useState } from 'react'

interface ExportButtonProps {
    onClick: () => Promise<void>
    filename: string
}

export function ExportButton({ onClick, filename }: ExportButtonProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleClick = async () => {
        setLoading(true)
        setError(null)
        try {
            await onClick()
        } catch (err) {
            setError('Export failed. Please try again.')
            console.error('Export error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-1">
            <button
                onClick={handleClick}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? (
                    <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <Download className="h-4 w-4" />
                        <span>Export CSV</span>
                    </>
                )}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
    )
}

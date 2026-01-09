'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Truck,
    MapPin,
    Calendar,
    FileImage,
    Clock,
    Eye,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    X,
    ZoomIn
} from 'lucide-react'

interface PodSubmission {
    id: string
    tripId: string
    tripNumber: number
    tanker: string
    driver: string
    customer: string
    station: string
    products: string[]
    quantity: number
    date: string
    uploadedAt: string
    uploadedBy: string
    files: { name: string; url: string }[]
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    reviewNote?: string
}

// Mock data for pending POD reviews
const mockPodSubmissions: PodSubmission[] = [
    {
        id: 'pod-1',
        tripId: 'trip-2026-01-09-tanker-1-1',
        tripNumber: 1,
        tanker: 'ABC-1234',
        driver: 'Juan Cruz',
        customer: 'Shell Philippines',
        station: 'Shell EDSA',
        products: ['DIESEL', 'UNLEADED 91'],
        quantity: 15000,
        date: '2026-01-09',
        uploadedAt: '2026-01-09T08:30:00',
        uploadedBy: 'John Encoder',
        files: [
            { name: 'pod_receipt_001.jpg', url: '/placeholder-pod.jpg' },
            { name: 'pod_signature_001.jpg', url: '/placeholder-pod.jpg' }
        ],
        status: 'PENDING'
    },
    {
        id: 'pod-2',
        tripId: 'trip-2026-01-09-tanker-4-1',
        tripNumber: 1,
        tanker: 'GHI-3456',
        driver: 'Pedro Santos',
        customer: 'Shell Philippines',
        station: 'Shell Ortigas',
        products: ['UNLEADED 91', 'DIESEL', 'PREMIUM GASOLINE'],
        quantity: 12000,
        date: '2026-01-09',
        uploadedAt: '2026-01-09T09:15:00',
        uploadedBy: 'John Encoder',
        files: [
            { name: 'delivery_receipt.pdf', url: '/placeholder-pod.pdf' }
        ],
        status: 'PENDING'
    },
    {
        id: 'pod-3',
        tripId: 'trip-2026-01-08-tanker-2-1',
        tripNumber: 1,
        tanker: 'XYZ-5678',
        driver: 'Maria Garcia',
        customer: 'Petron Corporation',
        station: 'Petron Makati',
        products: ['DIESEL'],
        quantity: 8000,
        date: '2026-01-08',
        uploadedAt: '2026-01-08T14:00:00',
        uploadedBy: 'John Encoder',
        files: [
            { name: 'pod_photo.jpg', url: '/placeholder-pod.jpg' }
        ],
        status: 'PENDING'
    }
]

export default function PodReviewPage() {
    const [submissions, setSubmissions] = useState<PodSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSubmission, setSelectedSubmission] = useState<PodSubmission | null>(null)
    const [reviewNote, setReviewNote] = useState('')
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

    useEffect(() => {
        // Simulate API fetch
        setLoading(true)
        setTimeout(() => {
            setSubmissions(mockPodSubmissions)
            setLoading(false)
        }, 500)
    }, [])

    const handleApprove = (submission: PodSubmission) => {
        setSubmissions(prev =>
            prev.map(s => s.id === submission.id
                ? { ...s, status: 'APPROVED' as const, reviewNote }
                : s
            )
        )
        setSelectedSubmission(null)
        setReviewNote('')
    }

    const handleReject = (submission: PodSubmission) => {
        if (!reviewNote.trim()) {
            alert('Please provide a reason for rejection.')
            return
        }
        setSubmissions(prev =>
            prev.map(s => s.id === submission.id
                ? { ...s, status: 'REJECTED' as const, reviewNote }
                : s
            )
        )
        setSelectedSubmission(null)
        setReviewNote('')
    }

    const filteredSubmissions = submissions.filter(s =>
        filter === 'all' || s.status === filter
    )

    const stats = {
        pending: submissions.filter(s => s.status === 'PENDING').length,
        approved: submissions.filter(s => s.status === 'APPROVED').length,
        rejected: submissions.filter(s => s.status === 'REJECTED').length,
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Eye className="h-7 w-7 text-purple-600" />
                    POD Review
                </h1>
                <p className="text-gray-500">Review and approve Proof of Delivery submissions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                    onClick={() => setFilter('PENDING')}
                    className={`bg-white rounded-xl border p-4 text-left transition-all ${filter === 'PENDING' ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-100'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                            <div className="text-sm text-gray-500">Pending Review</div>
                        </div>
                    </div>
                </button>
                <button
                    onClick={() => setFilter('APPROVED')}
                    className={`bg-white rounded-xl border p-4 text-left transition-all ${filter === 'APPROVED' ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-100'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
                            <div className="text-sm text-gray-500">Approved</div>
                        </div>
                    </div>
                </button>
                <button
                    onClick={() => setFilter('REJECTED')}
                    className={`bg-white rounded-xl border p-4 text-left transition-all ${filter === 'REJECTED' ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-100'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
                            <div className="text-sm text-gray-500">Rejected</div>
                        </div>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Submissions List */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">
                            {filter === 'all' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()} Submissions
                        </h2>
                        <button
                            onClick={() => setFilter('all')}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            View All
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions</h3>
                            <p className="text-gray-500">No POD submissions match the current filter.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                            {filteredSubmissions.map((submission) => (
                                <button
                                    key={submission.id}
                                    onClick={() => setSelectedSubmission(submission)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedSubmission?.id === submission.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-sm font-medium text-gray-900">
                                                    Trip #{submission.tripNumber}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${submission.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                                        submission.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {submission.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                                <Truck className="h-4 w-4" />
                                                {submission.tanker} • {submission.driver}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin className="h-4 w-4" />
                                                {submission.station}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 mb-1">
                                                {format(new Date(submission.uploadedAt), 'MMM d, h:mm a')}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <FileImage className="h-4 w-4" />
                                                {submission.files.length} file{submission.files.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Review Panel */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Review Details</h2>
                    </div>

                    {!selectedSubmission ? (
                        <div className="text-center py-12">
                            <Eye className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Submission</h3>
                            <p className="text-gray-500">Click on a submission to review its POD documents.</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {/* Submission Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium text-gray-900">
                                        Trip #{selectedSubmission.tripNumber} - {selectedSubmission.tanker}
                                    </span>
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500">Customer:</span>
                                        <div className="font-medium text-gray-900">{selectedSubmission.customer}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Station:</span>
                                        <div className="font-medium text-gray-900">{selectedSubmission.station}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Driver:</span>
                                        <div className="font-medium text-gray-900">{selectedSubmission.driver}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Quantity:</span>
                                        <div className="font-medium text-gray-900">{selectedSubmission.quantity.toLocaleString()} L</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Products:</span>
                                        <div className="flex gap-1 flex-wrap mt-1">
                                            {selectedSubmission.products.map((p, i) => (
                                                <span key={i} className="text-xs px-2 py-0.5 bg-white rounded">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Uploaded by:</span>
                                        <div className="font-medium text-gray-900">{selectedSubmission.uploadedBy}</div>
                                    </div>
                                </div>
                            </div>

                            {/* POD Files */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">POD Documents</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedSubmission.files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer group"
                                        >
                                            <div className="aspect-[4/3] bg-gray-200 rounded mb-2 flex items-center justify-center relative">
                                                <FileImage className="h-8 w-8 text-gray-400" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                                    <ZoomIn className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 truncate">{file.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Review Actions */}
                            {selectedSubmission.status === 'PENDING' && (
                                <>
                                    {/* Review Note */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            <MessageSquare className="h-4 w-4 inline mr-1" />
                                            Review Note (required for rejection)
                                        </label>
                                        <textarea
                                            value={reviewNote}
                                            onChange={(e) => setReviewNote(e.target.value)}
                                            placeholder="Add a note about this POD..."
                                            className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleReject(selectedSubmission)}
                                            className="flex-1 py-3 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center gap-2"
                                        >
                                            <ThumbsDown className="h-5 w-5" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedSubmission)}
                                            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <ThumbsUp className="h-5 w-5" />
                                            Approve
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Review Result */}
                            {selectedSubmission.status !== 'PENDING' && (
                                <div className={`p-4 rounded-lg ${selectedSubmission.status === 'APPROVED' ? 'bg-green-50' : 'bg-red-50'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {selectedSubmission.status === 'APPROVED' ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        )}
                                        <span className={`font-medium ${selectedSubmission.status === 'APPROVED' ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                            {selectedSubmission.status}
                                        </span>
                                    </div>
                                    {selectedSubmission.reviewNote && (
                                        <p className="text-sm text-gray-600">
                                            Note: {selectedSubmission.reviewNote}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

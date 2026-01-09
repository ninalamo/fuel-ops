'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import {
    ArrowLeft,
    Truck,
    MapPin,
    User,
    Calendar,
    Fuel,
    Upload,
    FileImage,
    CheckCircle,
    XCircle,
    Clock,
    MessageSquare,
    Eye,
    Trash2,
    AlertCircle,
    Send,
    ChevronDown
} from 'lucide-react'

interface Trip {
    id: string
    tankerDayId: string
    date: string
    tripNumber: number
    tanker: string
    driver: string
    porter: string
    customer: string
    station: string
    products: string[]
    quantity: number
    status: 'PENDING' | 'DEPARTED' | 'DELIVERED' | 'RETURNED'
    departedAt: string | null
    deliveredAt: string | null
    hasPod: boolean
    hasException: boolean
    podFiles?: { name: string; size: number; uploadedAt: string }[]
    podStatus?: 'PENDING_UPLOAD' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
    podReviewComment?: string
    podReviewedAt?: string
    podReviewedBy?: string
}

interface Comment {
    id: string
    author: string
    role: string
    message: string
    createdAt: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
const INITIAL_COMMENTS_SHOWN = 5

// Mock comments for demo
const MOCK_COMMENTS: Comment[] = [
    { id: 'c1', author: 'Carlos Supervisor', role: 'supervisor', message: 'Please ensure the delivery receipt is included with the POD upload.', createdAt: '2026-01-09T09:30:00' },
    { id: 'c2', author: 'John Encoder', role: 'encoder', message: 'Understood, will upload shortly.', createdAt: '2026-01-09T09:25:00' },
    { id: 'c3', author: 'Carlos Supervisor', role: 'supervisor', message: 'The customer confirmed the delivery. Good work!', createdAt: '2026-01-09T08:45:00' },
    { id: 'c4', author: 'John Encoder', role: 'encoder', message: 'Delivery completed without issues.', createdAt: '2026-01-09T08:20:00' },
    { id: 'c5', author: 'John Encoder', role: 'encoder', message: 'Departing for Shell EDSA now.', createdAt: '2026-01-09T06:35:00' },
    { id: 'c6', author: 'Carlos Supervisor', role: 'supervisor', message: 'Approved for departure. Drive safe.', createdAt: '2026-01-09T06:30:00' },
    { id: 'c7', author: 'John Encoder', role: 'encoder', message: 'Tanker loaded and ready for dispatch.', createdAt: '2026-01-09T06:15:00' },
]

export default function TripDetailPage() {
    const params = useParams()
    const tripId = params.id as string

    const [trip, setTrip] = useState<Trip | null>(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)

    // Upload state
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Review state (for Supervisor)
    const [reviewComment, setReviewComment] = useState('')
    const [reviewing, setReviewing] = useState(false)

    // Comments state
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [showAllComments, setShowAllComments] = useState(false)
    const [submittingComment, setSubmittingComment] = useState(false)

    useEffect(() => {
        const role = localStorage.getItem('userRole')
        const name = localStorage.getItem('userName')
        setUserRole(role)
        setUserName(name)
        fetchTrip()
        setComments(MOCK_COMMENTS)
    }, [tripId])

    const fetchTrip = async () => {
        setLoading(true)
        try {
            const mockTrip: Trip = {
                id: tripId,
                tankerDayId: 'td-2026-01-09-tanker-1',
                date: '2026-01-09',
                tripNumber: 1,
                tanker: 'ABC-1234',
                driver: 'Juan Cruz',
                porter: 'Carlos Lopez',
                customer: 'Shell Philippines',
                station: 'Shell EDSA',
                products: ['DIESEL', 'UNLEADED 91'],
                quantity: 15000,
                status: 'DELIVERED',
                departedAt: '2026-01-09T06:30:00',
                deliveredAt: '2026-01-09T08:15:00',
                hasPod: false,
                hasException: false,
                podStatus: 'PENDING_UPLOAD',
                podFiles: []
            }
            setTrip(mockTrip)
        } catch (error) {
            console.error('Error fetching trip:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null)
        if (!e.target.files) return

        const files = Array.from(e.target.files)
        const validFiles: File[] = []

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setUploadError(`"${file.name}" is not allowed. Only images and PDF files are accepted.`)
                continue
            }
            if (file.size > MAX_FILE_SIZE) {
                setUploadError(`"${file.name}" exceeds 5MB limit.`)
                continue
            }
            validFiles.push(file)
        }

        setUploadedFiles(prev => [...prev, ...validFiles])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (uploadedFiles.length === 0 || !trip) return

        setUploading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            setTrip({
                ...trip,
                hasPod: true,
                podStatus: 'PENDING_REVIEW',
                podFiles: uploadedFiles.map(f => ({
                    name: f.name,
                    size: f.size,
                    uploadedAt: new Date().toISOString()
                }))
            })
            setUploadedFiles([])
            // Add system comment
            const newCommentObj: Comment = {
                id: `c${Date.now()}`,
                author: userName || 'Encoder',
                role: userRole || 'encoder',
                message: 'POD uploaded successfully. Pending supervisor review.',
                createdAt: new Date().toISOString()
            }
            setComments(prev => [newCommentObj, ...prev])
        } catch (error) {
            console.error('Error uploading:', error)
            setUploadError('Failed to upload files. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleApprove = async () => {
        if (!trip) return
        setReviewing(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            setTrip({
                ...trip,
                podStatus: 'APPROVED',
                podReviewComment: reviewComment || undefined,
                podReviewedAt: new Date().toISOString(),
                podReviewedBy: userName || 'Supervisor'
            })
            if (reviewComment) {
                const newCommentObj: Comment = {
                    id: `c${Date.now()}`,
                    author: userName || 'Supervisor',
                    role: userRole || 'supervisor',
                    message: `POD Approved. ${reviewComment}`,
                    createdAt: new Date().toISOString()
                }
                setComments(prev => [newCommentObj, ...prev])
            }
            setReviewComment('')
        } finally {
            setReviewing(false)
        }
    }

    const handleReject = async () => {
        if (!trip) return
        if (!reviewComment.trim()) {
            alert('Please provide a reason for rejection.')
            return
        }
        setReviewing(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            setTrip({
                ...trip,
                podStatus: 'REJECTED',
                podReviewComment: reviewComment,
                podReviewedAt: new Date().toISOString(),
                podReviewedBy: userName || 'Supervisor'
            })
            const newCommentObj: Comment = {
                id: `c${Date.now()}`,
                author: userName || 'Supervisor',
                role: userRole || 'supervisor',
                message: `POD Rejected: ${reviewComment}`,
                createdAt: new Date().toISOString()
            }
            setComments(prev => [newCommentObj, ...prev])
            setReviewComment('')
        } finally {
            setReviewing(false)
        }
    }

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return

        setSubmittingComment(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 500))
            const commentObj: Comment = {
                id: `c${Date.now()}`,
                author: userName || 'User',
                role: userRole || 'encoder',
                message: newComment.trim(),
                createdAt: new Date().toISOString()
            }
            setComments(prev => [commentObj, ...prev])
            setNewComment('')
        } finally {
            setSubmittingComment(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-gray-100 text-gray-700',
            DEPARTED: 'bg-blue-100 text-blue-700',
            DELIVERED: 'bg-green-100 text-green-700',
            RETURNED: 'bg-orange-100 text-orange-700',
        }
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
                {status}
            </span>
        )
    }

    const getPodStatusBadge = (status?: string) => {
        if (!status) return null
        const styles: Record<string, { bg: string; icon: typeof Clock }> = {
            PENDING_UPLOAD: { bg: 'bg-gray-100 text-gray-600', icon: Clock },
            PENDING_REVIEW: { bg: 'bg-yellow-100 text-yellow-700', icon: Eye },
            APPROVED: { bg: 'bg-green-100 text-green-700', icon: CheckCircle },
            REJECTED: { bg: 'bg-red-100 text-red-700', icon: XCircle },
        }
        const style = styles[status] || styles.PENDING_UPLOAD
        const Icon = style.icon
        const labels: Record<string, string> = {
            PENDING_UPLOAD: 'Pending Upload',
            PENDING_REVIEW: 'Pending Review',
            APPROVED: 'Approved',
            REJECTED: 'Rejected',
        }
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg}`}>
                <Icon className="h-3 w-3" />
                {labels[status]}
            </span>
        )
    }

    const visibleComments = showAllComments ? comments : comments.slice(0, INITIAL_COMMENTS_SHOWN)
    const hasMoreComments = comments.length > INITIAL_COMMENTS_SHOWN

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!trip) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                <h1 className="text-xl font-bold text-gray-900">Trip Not Found</h1>
                <Link href="/trips" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Trips
                </Link>
            </div>
        )
    }

    const canUpload = userRole === 'encoder' || userRole === 'admin'
    const canReview = userRole === 'supervisor' || userRole === 'admin'
    const canComment = userRole === 'encoder' || userRole === 'supervisor' || userRole === 'admin'
    const showUploadSection = canUpload && (trip.podStatus === 'PENDING_UPLOAD' || trip.podStatus === 'REJECTED')
    const showReviewSection = canReview && trip.podStatus === 'PENDING_REVIEW'

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/trips"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Trips
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Trip #{trip.tripNumber}
                        </h1>
                        <p className="text-gray-500">{trip.tanker} • {format(new Date(trip.date), 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(trip.status)}
                        {getPodStatusBadge(trip.podStatus)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trip Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-xs text-gray-500">Tanker</div>
                                    <div className="font-medium text-gray-900">{trip.tanker}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-xs text-gray-500">Driver / Porter</div>
                                    <div className="font-medium text-gray-900">{trip.driver} / {trip.porter}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-xs text-gray-500">Customer / Station</div>
                                    <div className="font-medium text-gray-900">{trip.customer}</div>
                                    <div className="text-sm text-gray-600">{trip.station}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Fuel className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-xs text-gray-500">Products</div>
                                    <div className="flex gap-1 flex-wrap mt-1">
                                        {trip.products.map((p, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-xs text-gray-500">Departed / Delivered</div>
                                    <div className="font-medium text-gray-900">
                                        {trip.departedAt ? format(new Date(trip.departedAt), 'h:mm a') : '-'}
                                        {' → '}
                                        {trip.deliveredAt ? format(new Date(trip.deliveredAt), 'h:mm a') : '-'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Fuel className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-xs text-gray-500">Quantity</div>
                                    <div className="font-medium text-gray-900">{trip.quantity.toLocaleString()} L</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* POD Files (if uploaded) */}
                    {trip.podFiles && trip.podFiles.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Uploaded POD Documents</h2>
                            <div className="space-y-2">
                                {trip.podFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FileImage className="h-5 w-5 text-blue-600" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {(file.size / 1024).toFixed(1)} KB • {format(new Date(file.uploadedAt), 'MMM d, h:mm a')}
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Review Result (if reviewed) */}
                    {(trip.podStatus === 'APPROVED' || trip.podStatus === 'REJECTED') && (
                        <div className={`rounded-xl border p-6 ${trip.podStatus === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {trip.podStatus === 'APPROVED' ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span className={`font-medium ${trip.podStatus === 'APPROVED' ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                    POD {trip.podStatus}
                                </span>
                            </div>
                            {trip.podReviewComment && (
                                <p className="text-sm text-gray-700 mb-2">
                                    <strong>Comment:</strong> {trip.podReviewComment}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Reviewed by {trip.podReviewedBy} on {trip.podReviewedAt && format(new Date(trip.podReviewedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                        </div>
                    )}

                    {/* Comments Section */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-gray-400" />
                            Comments ({comments.length})
                        </h2>

                        {/* Add Comment */}
                        {canComment && (
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !submittingComment && handleSubmitComment()}
                                        placeholder="Add a comment..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleSubmitComment}
                                        disabled={!newComment.trim() || submittingComment}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Comments List */}
                        {comments.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No comments yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {visibleComments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${comment.role === 'supervisor' ? 'bg-purple-100 text-purple-700' :
                                                comment.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {comment.author.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                                                <span className="text-xs text-gray-400">
                                                    {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.message}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* See More Button */}
                                {hasMoreComments && !showAllComments && (
                                    <button
                                        onClick={() => setShowAllComments(true)}
                                        className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                        See {comments.length - INITIAL_COMMENTS_SHOWN} more comments
                                    </button>
                                )}

                                {showAllComments && hasMoreComments && (
                                    <button
                                        onClick={() => setShowAllComments(false)}
                                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Show less
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Upload or Review */}
                <div className="space-y-6">
                    {/* Upload Section (Encoder) */}
                    {showUploadSection && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                <Upload className="h-5 w-5 inline mr-2 text-blue-600" />
                                Upload POD
                            </h2>

                            {trip.podStatus === 'REJECTED' && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4 inline mr-1" />
                                    Previous upload was rejected. Please upload corrected documents.
                                </div>
                            )}

                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center mb-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="pod-files"
                                    multiple
                                    accept="image/*,.pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <label htmlFor="pod-files" className="cursor-pointer">
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm font-medium text-gray-900">Click to upload</p>
                                    <p className="text-xs text-gray-500 mt-1">Images or PDF, max 5MB each</p>
                                </label>
                            </div>

                            {uploadError && (
                                <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded-lg">
                                    {uploadError}
                                </div>
                            )}

                            {uploadedFiles.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {uploadedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileImage className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                <span className="text-sm text-gray-900 truncate">{file.name}</span>
                                                <span className="text-xs text-gray-500 flex-shrink-0">
                                                    {(file.size / 1024).toFixed(0)} KB
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removeFile(idx)}
                                                className="text-gray-400 hover:text-red-600 flex-shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={uploadedFiles.length === 0 || uploading}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Upload POD
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Review Section (Supervisor) */}
                    {showReviewSection && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                <Eye className="h-5 w-5 inline mr-2 text-purple-600" />
                                Review POD
                            </h2>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <MessageSquare className="h-4 w-4 inline mr-1" />
                                    Comment (required for rejection)
                                </label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Add review notes..."
                                    className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReject}
                                    disabled={reviewing}
                                    className="flex-1 py-2.5 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={reviewing}
                                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status info when no action needed */}
                    {!showUploadSection && !showReviewSection && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 text-center">
                            {trip.podStatus === 'PENDING_REVIEW' && canUpload && (
                                <p className="text-sm text-gray-600">
                                    <Clock className="h-5 w-5 inline mr-2 text-yellow-600" />
                                    POD is pending supervisor review.
                                </p>
                            )}
                            {trip.podStatus === 'APPROVED' && (
                                <p className="text-sm text-gray-600">
                                    <CheckCircle className="h-5 w-5 inline mr-2 text-green-600" />
                                    POD has been approved.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import {
    ArrowLeft,
    Truck,
    User,
    Fuel,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    Upload,
    FileText,
    Eye,
    Send,
    AlertCircle,
    Calendar,
    X,
    MessageSquare
} from 'lucide-react'

// POD document upload
interface PODFile {
    name: string
    size: number
    uploadedAt: string
}

interface POD {
    id: string
    files: PODFile[]
    status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
    uploadedBy: string
    uploadedAt: string
    reviewComment?: string
    reviewedAt?: string
    reviewedBy?: string
}

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
    status: 'PENDING' | 'EN_ROUTE' | 'RETURNED' | 'COMPLETED'
    departedAt: string | null
    returnedAt: string | null
    completedAt: string | null
    hasPod: boolean
    hasException: boolean
    pods: POD[]
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

type TabType = 'details' | 'pods' | 'comments'

export default function TripDetailPage() {
    const params = useParams()
    const tripId = params.id as string

    const [trip, setTrip] = useState<Trip | null>(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<TabType>('details')

    // Upload state
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Review state (for Supervisor)
    const [reviewComment, setReviewComment] = useState('')
    const [reviewing, setReviewing] = useState(false)
    const [selectedPodId, setSelectedPodId] = useState<string | null>(null)

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
    }, [tripId])

    const fetchTrip = async () => {
        setLoading(true)
        try {
            // Fetch trip data from json-server
            const tripRes = await fetch(`http://localhost:3001/trips/${tripId}`)
            if (!tripRes.ok) throw new Error('Trip not found')
            const tripData = await tripRes.json()

            // Fetch PODs for this trip
            const podsRes = await fetch(`http://localhost:3001/pods?tripId=${tripId}`)
            const podsData = await podsRes.json()

            // Fetch comments for this trip
            const commentsRes = await fetch(`http://localhost:3001/tripComments?tripId=${tripId}&_sort=createdAt&_order=desc`)
            const commentsData = await commentsRes.json()

            // Combine trip with its PODs
            setTrip({
                ...tripData,
                pods: podsData || []
            })
            setComments(commentsData || [])
        } catch (error) {
            console.error('Error fetching trip:', error)
        } finally {
            setLoading(false)
        }
    }

    // File handling
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setUploadError(null)

        const validFiles: File[] = []
        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setUploadError(`Invalid file type: ${file.name}. Only images and PDFs are allowed.`)
                continue
            }
            if (file.size > MAX_FILE_SIZE) {
                setUploadError(`File too large: ${file.name}. Maximum size is 5MB.`)
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

    const handleUploadPod = async () => {
        if (uploadedFiles.length === 0 || !trip) return

        setUploading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))

            const newPod: POD = {
                id: `pod-${Date.now()}`,
                files: uploadedFiles.map(f => ({
                    name: f.name,
                    size: f.size,
                    uploadedAt: new Date().toISOString()
                })),
                status: 'PENDING_REVIEW',
                uploadedBy: userName || 'Encoder',
                uploadedAt: new Date().toISOString()
            }

            setTrip({
                ...trip,
                hasPod: true,
                status: 'COMPLETED',  // Trip completed when POD uploaded
                completedAt: new Date().toISOString(),
                pods: [...trip.pods, newPod]
            })
            setUploadedFiles([])

            // Add system event
            const newCommentObj: Comment = {
                id: `c${Date.now()}`,
                author: 'System',
                role: 'system',
                message: `POD uploaded with ${uploadedFiles.length} file(s). Trip marked as completed.`,
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

    const handleApprovePod = async (podId: string) => {
        if (!trip) return
        setReviewing(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            setTrip({
                ...trip,
                pods: trip.pods.map(pod =>
                    pod.id === podId
                        ? {
                            ...pod,
                            status: 'APPROVED' as const,
                            reviewComment: reviewComment || undefined,
                            reviewedAt: new Date().toISOString(),
                            reviewedBy: userName || 'Supervisor'
                        }
                        : pod
                )
            })
            const newCommentObj: Comment = {
                id: `c${Date.now()}`,
                author: userName || 'Supervisor',
                role: userRole || 'supervisor',
                message: `POD approved.${reviewComment ? ` Comment: ${reviewComment}` : ''}`,
                createdAt: new Date().toISOString()
            }
            setComments(prev => [newCommentObj, ...prev])
            setReviewComment('')
            setSelectedPodId(null)
        } finally {
            setReviewing(false)
        }
    }

    const handleRejectPod = async (podId: string) => {
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
                pods: trip.pods.map(pod =>
                    pod.id === podId
                        ? {
                            ...pod,
                            status: 'REJECTED' as const,
                            reviewComment,
                            reviewedAt: new Date().toISOString(),
                            reviewedBy: userName || 'Supervisor'
                        }
                        : pod
                )
            })
            const newCommentObj: Comment = {
                id: `c${Date.now()}`,
                author: userName || 'Supervisor',
                role: userRole || 'supervisor',
                message: `POD rejected. Reason: ${reviewComment}`,
                createdAt: new Date().toISOString()
            }
            setComments(prev => [newCommentObj, ...prev])
            setReviewComment('')
            setSelectedPodId(null)
        } finally {
            setReviewing(false)
        }
    }

    // Trip status actions
    const handleMarkDeparted = async () => {
        if (!trip) return
        setUploading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 500))
            setTrip({
                ...trip,
                status: 'EN_ROUTE',
                departedAt: new Date().toISOString()
            })
            const newCommentObj: Comment = {
                id: `c${Date.now()}`,
                author: 'System',
                role: 'system',
                message: 'Trip marked as departed. Tanker is en route.',
                createdAt: new Date().toISOString()
            }
            setComments(prev => [newCommentObj, ...prev])
        } finally {
            setUploading(false)
        }
    }

    const handleMarkReturned = async () => {
        if (!trip) return
        setUploading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 500))
            setTrip({
                ...trip,
                status: 'RETURNED',
                returnedAt: new Date().toISOString()
            })
            const newCommentObj: Comment = {
                id: `c${Date.now()}`,
                author: 'System',
                role: 'system',
                message: 'Trip marked as returned. Tanker is back. Awaiting POD upload.',
                createdAt: new Date().toISOString()
            }
            setComments(prev => [newCommentObj, ...prev])
        } finally {
            setUploading(false)
        }
    }

    // Comments
    const handleSubmitComment = async () => {
        if (!newComment.trim()) return
        setSubmittingComment(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 500))
            const newCommentObj: Comment = {
                id: `c${Date.now()}`,
                author: userName || 'User',
                role: userRole || 'encoder',
                message: newComment.trim(),
                createdAt: new Date().toISOString()
            }
            setComments(prev => [newCommentObj, ...prev])
            setNewComment('')
        } finally {
            setSubmittingComment(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-gray-100 text-gray-700',
            EN_ROUTE: 'bg-blue-100 text-blue-700',
            RETURNED: 'bg-orange-100 text-orange-700',
            COMPLETED: 'bg-green-100 text-green-700',
        }
        const labels: Record<string, string> = {
            PENDING: 'Pending',
            EN_ROUTE: 'En Route',
            RETURNED: 'Returned',
            COMPLETED: 'Completed',
        }
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
                {labels[status] || status}
            </span>
        )
    }

    const getPodStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; icon: typeof Clock }> = {
            PENDING_REVIEW: { bg: 'bg-yellow-100 text-yellow-700', icon: Eye },
            APPROVED: { bg: 'bg-green-100 text-green-700', icon: CheckCircle },
            REJECTED: { bg: 'bg-red-100 text-red-700', icon: XCircle },
        }
        const style = styles[status] || styles.PENDING_REVIEW
        const Icon = style.icon
        const labels: Record<string, string> = {
            PENDING_REVIEW: 'Pending Review',
            APPROVED: 'Approved',
            REJECTED: 'Rejected',
        }
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${style.bg}`}>
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
    const canChangeStatus = userRole === 'encoder' || userRole === 'admin'

    // Status action conditions
    const showMarkDeparted = canChangeStatus && trip.status === 'PENDING'
    const showMarkReturned = canChangeStatus && trip.status === 'EN_ROUTE'

    // POD upload only when trip is RETURNED (awaiting POD to complete)
    const showUploadSection = canUpload && trip.status === 'RETURNED'

    // Count pending PODs for supervisor
    const pendingPods = trip.pods.filter(p => p.status === 'PENDING_REVIEW')

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={userRole === 'encoder' ? `/tanker-days/${trip.tankerDayId}` : '/trips'}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {userRole === 'encoder' ? `Back to ${trip.tanker} (${format(new Date(trip.date), 'MMM d, yyyy')})` : 'Back to Trips'}
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Trip #{trip.tripNumber}
                        </h1>
                        <p className="text-gray-500">{trip.tanker} • {format(new Date(trip.date), 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {getStatusBadge(trip.status)}
                        {/* Trip status actions */}
                        {showMarkDeparted && (
                            <button
                                onClick={handleMarkDeparted}
                                disabled={uploading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Truck className="h-4 w-4" />
                                Mark Departed
                            </button>
                        )}
                        {showMarkReturned && (
                            <button
                                onClick={handleMarkReturned}
                                disabled={uploading}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Mark Returned
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'details'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Truck className="h-4 w-4 inline mr-2" />
                        Trip Details
                    </button>
                    <button
                        onClick={() => setActiveTab('pods')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'pods'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <FileText className="h-4 w-4 inline mr-2" />
                        PODs ({trip.pods.length})
                        {pendingPods.length > 0 && canReview && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                {pendingPods.length} pending
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'comments'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        Comments ({comments.length})
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        <Truck className="h-5 w-5 inline mr-2 text-blue-600" />
                        Trip Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <div className="text-sm text-gray-500">{trip.station}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Fuel className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-xs text-gray-500">Products</div>
                                <div className="flex gap-2 flex-wrap mt-1">
                                    {trip.products.map((product, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                                            {product}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-xs text-gray-500">Departed / Completed</div>
                                <div className="font-medium text-gray-900">
                                    {trip.departedAt ? format(new Date(trip.departedAt), 'h:mm a') : '-'}
                                    {' → '}
                                    {trip.completedAt ? format(new Date(trip.completedAt), 'h:mm a') : '-'}
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

                    {/* Warning if completed without POD */}
                    {trip.status === 'COMPLETED' && trip.pods.length === 0 && (
                        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium text-orange-800">No POD Uploaded</div>
                                <p className="text-sm text-orange-700">This trip is completed but has no Proof of Delivery documents. Please upload POD documents.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'pods' && (
                <div className="space-y-6">
                    {/* Upload New POD */}
                    {showUploadSection && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                <Upload className="h-5 w-5 inline mr-2 text-blue-600" />
                                Upload New POD
                            </h2>

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
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-700">{file.name}</span>
                                                <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                            <button
                                                onClick={() => removeFile(idx)}
                                                className="p-1 hover:bg-gray-200 rounded"
                                            >
                                                <X className="h-4 w-4 text-gray-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleUploadPod}
                                disabled={uploadedFiles.length === 0 || uploading}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                {uploading ? 'Uploading...' : 'Upload POD'}
                            </button>
                        </div>
                    )}

                    {/* POD List */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            <FileText className="h-5 w-5 inline mr-2 text-purple-600" />
                            Uploaded PODs ({trip.pods.length})
                        </h2>

                        {trip.pods.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                                <p>No PODs uploaded yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {trip.pods.map((pod) => (
                                    <div key={pod.id} className="border border-gray-100 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {getPodStatusBadge(pod.status)}
                                                <span className="text-sm text-gray-500">
                                                    Uploaded by {pod.uploadedBy} • {format(new Date(pod.uploadedAt), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Files */}
                                        <div className="space-y-2 mb-3">
                                            {pod.files.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">{file.name}</span>
                                                    <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Review Comment */}
                                        {pod.reviewComment && (
                                            <div className={`p-3 rounded-lg text-sm ${pod.status === 'APPROVED' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                                <strong>Review:</strong> {pod.reviewComment}
                                                {pod.reviewedBy && (
                                                    <div className="text-xs mt-1 opacity-75">
                                                        — {pod.reviewedBy}, {pod.reviewedAt && format(new Date(pod.reviewedAt), 'MMM d, h:mm a')}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Review Actions (Supervisor only) */}
                                        {canReview && pod.status === 'PENDING_REVIEW' && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <textarea
                                                    value={selectedPodId === pod.id ? reviewComment : ''}
                                                    onChange={(e) => {
                                                        setSelectedPodId(pod.id)
                                                        setReviewComment(e.target.value)
                                                    }}
                                                    onFocus={() => setSelectedPodId(pod.id)}
                                                    placeholder="Add review comment (required for rejection)..."
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows={2}
                                                />
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleRejectPod(pod.id)}
                                                        disabled={reviewing}
                                                        className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprovePod(pod.id)}
                                                        disabled={reviewing}
                                                        className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'comments' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        <MessageSquare className="h-5 w-5 inline mr-2 text-purple-600" />
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
                                <div key={comment.id} className={`flex gap-3 ${comment.role === 'system' ? 'bg-gray-50 p-2 rounded-lg' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${comment.role === 'system' ? 'bg-gray-200 text-gray-600' :
                                        comment.role === 'supervisor' ? 'bg-purple-100 text-purple-700' :
                                            comment.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {comment.role === 'system' ? '⚡' : comment.author.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-sm font-medium ${comment.role === 'system' ? 'text-gray-600' : 'text-gray-900'}`}>
                                                {comment.role === 'system' ? 'Event' : comment.author}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${comment.role === 'system' ? 'text-gray-600 italic' : 'text-gray-700'}`}>{comment.message}</p>
                                    </div>
                                </div>
                            ))}

                            {/* See More Button */}
                            {hasMoreComments && !showAllComments && (
                                <button
                                    onClick={() => setShowAllComments(true)}
                                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                                >
                                    See {comments.length - INITIAL_COMMENTS_SHOWN} more comments
                                </button>
                            )}

                            {/* Collapse Button */}
                            {showAllComments && hasMoreComments && (
                                <button
                                    onClick={() => setShowAllComments(false)}
                                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                                >
                                    Show less
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

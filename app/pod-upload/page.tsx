'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
    ArrowLeft,
    Upload,
    Truck,
    MapPin,
    Calendar,
    FileImage,
    CheckCircle,
    Clock,
    X,
    Image as ImageIcon
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
    hasPod: boolean
    podStatus?: 'PENDING_UPLOAD' | 'UPLOADED' | 'APPROVED' | 'REJECTED'
    podFiles?: string[]
}

export default function PodUploadPage() {
    const [trips, setTrips] = useState<Trip[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        fetchTrips()
    }, [])

    const fetchTrips = async () => {
        setLoading(true)
        try {
            // Fetch trips that need POD upload (DELIVERED or RETURNED without POD)
            const res = await fetch('/api/trips')
            const data = await res.json()
            // Filter to trips that need POD upload
            const needsPod = data.filter((t: Trip) =>
                (t.status === 'DELIVERED' || t.status === 'RETURNED') && !t.hasPod
            )
            setTrips(needsPod)
        } catch (error) {
            console.error('Error fetching trips:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setUploadedFiles(Array.from(e.target.files))
        }
    }

    const handleUpload = async () => {
        if (!selectedTrip || uploadedFiles.length === 0) return

        setUploading(true)
        try {
            // Simulate upload - in real app, would POST to API
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Update local state
            setTrips(prev => prev.filter(t => t.id !== selectedTrip.id))
            setSelectedTrip(null)
            setUploadedFiles([])

            alert('POD uploaded successfully! Pending supervisor review.')
        } catch (error) {
            console.error('Error uploading POD:', error)
            alert('Failed to upload POD. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index))
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
                    <Upload className="h-7 w-7 text-blue-600" />
                    POD Upload
                </h1>
                <p className="text-gray-500">Upload Proof of Delivery documents for completed trips</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{trips.length}</div>
                            <div className="text-sm text-gray-500">Pending Upload</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileImage className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <div className="text-sm text-gray-500">Awaiting Review</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <div className="text-sm text-gray-500">Approved Today</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trips List */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Trips Pending POD Upload</h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                        </div>
                    ) : trips.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
                            <p className="text-gray-500">No trips pending POD upload.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                            {trips.map((trip) => (
                                <button
                                    key={trip.id}
                                    onClick={() => setSelectedTrip(trip)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedTrip?.id === trip.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-sm font-medium text-gray-900">
                                                    Trip #{trip.tripNumber}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(trip.date), 'MMM d')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                                <Truck className="h-4 w-4" />
                                                {trip.tanker}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin className="h-4 w-4" />
                                                {trip.station}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex gap-1 flex-wrap justify-end mb-1">
                                                {trip.products.map((p, i) => (
                                                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {trip.quantity.toLocaleString()} L
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upload Panel */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Upload POD</h2>
                    </div>

                    {!selectedTrip ? (
                        <div className="text-center py-12">
                            <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Trip</h3>
                            <p className="text-gray-500">Click on a trip to upload its POD documents.</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {/* Trip Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900">
                                        Trip #{selectedTrip.tripNumber} - {selectedTrip.tanker}
                                    </span>
                                    <button
                                        onClick={() => setSelectedTrip(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {selectedTrip.customer} - {selectedTrip.station}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4" />
                                        {format(new Date(selectedTrip.date), 'MMMM d, yyyy')}
                                    </div>
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    id="pod-files"
                                    multiple
                                    accept="image/*,.pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="pod-files"
                                    className="cursor-pointer"
                                >
                                    <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, or PDF up to 10MB each
                                    </p>
                                </label>
                            </div>

                            {/* File List */}
                            {uploadedFiles.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-900">Selected Files</h4>
                                    {uploadedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileImage className="h-5 w-5 text-blue-600" />
                                                <span className="text-sm text-gray-900">{file.name}</span>
                                                <span className="text-xs text-gray-500">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="text-gray-400 hover:text-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleUpload}
                                disabled={uploadedFiles.length === 0 || uploading}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5" />
                                        Upload POD ({uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''})
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

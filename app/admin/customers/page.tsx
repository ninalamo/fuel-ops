'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Plus, Building2, Edit2, Trash2, Save, Phone, Mail, MapPin } from 'lucide-react'
import { Modal } from '@/components/Modal'

interface Customer {
    id: string
    name: string
    contactPerson: string
    email: string
    phone: string
    address: string
    status: 'ACTIVE' | 'INACTIVE'
    stationCount: number
}

const MOCK_CUSTOMERS: Customer[] = [
    { id: 'c1', name: 'Shell Philippines', contactPerson: 'John Smith', email: 'john@shell.ph', phone: '02-8888-1111', address: 'Makati City', status: 'ACTIVE', stationCount: 15 },
    { id: 'c2', name: 'Petron Corporation', contactPerson: 'Maria Santos', email: 'maria@petron.com', phone: '02-8888-2222', address: 'Ortigas Center', status: 'ACTIVE', stationCount: 12 },
    { id: 'c3', name: 'Caltex Philippines', contactPerson: 'Pedro Cruz', email: 'pedro@caltex.ph', phone: '02-8888-3333', address: 'BGC Taguig', status: 'ACTIVE', stationCount: 8 },
    { id: 'c4', name: 'Phoenix Petroleum', contactPerson: 'Ana Reyes', email: 'ana@phoenix.ph', phone: '02-8888-4444', address: 'Pasig City', status: 'ACTIVE', stationCount: 5 },
    { id: 'c5', name: 'Seaoil Philippines', contactPerson: 'Luis Garcia', email: 'luis@seaoil.com', phone: '02-8888-5555', address: 'Quezon City', status: 'INACTIVE', stationCount: 2 },
]

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS)
    const [showModal, setShowModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '', status: 'ACTIVE' as Customer['status'] })

    const openCreateModal = () => {
        setEditingCustomer(null)
        setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', status: 'ACTIVE' })
        setShowModal(true)
    }

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer)
        setFormData({ name: customer.name, contactPerson: customer.contactPerson, email: customer.email, phone: customer.phone, address: customer.address, status: customer.status })
        setShowModal(true)
    }

    const handleSave = () => {
        if (editingCustomer) {
            setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c))
        } else {
            setCustomers([...customers, { id: `c${Date.now()}`, ...formData, stationCount: 0 }])
        }
        setShowModal(false)
    }

    const handleDelete = (id: string) => {
        setCustomers(customers.filter(c => c.id !== id))
        setShowDeleteConfirm(null)
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg"><Building2 className="h-6 w-6 text-yellow-600" /></div>
                        <div><h1 className="text-2xl font-bold text-gray-900">Customers</h1><p className="text-gray-500">Manage customer accounts</p></div>
                    </div>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"><Plus className="h-4 w-4" /> Add Customer</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Stations</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {customers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                    <div className="text-xs text-gray-500">{customer.contactPerson}</div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-1 text-gray-600"><Mail className="h-3 w-3" />{customer.email}</div>
                                    <div className="flex items-center gap-1 text-gray-500"><Phone className="h-3 w-3" />{customer.phone}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" />{customer.address}</td>
                                <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{customer.stationCount}</span></td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{customer.status}</span></td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEditModal(customer)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => setShowDeleteConfirm(customer.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'} size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label><input type="text" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} disabled={!formData.name} className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"><Save className="h-4 w-4" /> {editingCustomer ? 'Save' : 'Create'}</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Customer" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this customer?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

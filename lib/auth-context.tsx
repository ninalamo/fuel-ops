'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export type UserRole = 'encoder' | 'validator' | 'supervisor' | 'admin'

interface User {
    name: string
    role: UserRole
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    logout: () => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    logout: () => { },
})

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check for stored role (demo auth)
        const storedRole = localStorage.getItem('userRole') as UserRole | null
        const storedName = localStorage.getItem('userName')

        if (storedRole && storedName) {
            setUser({ name: storedName, role: storedRole })
        }
        setIsLoading(false)
    }, [])

    useEffect(() => {
        // Redirect to login if not authenticated (except on login page)
        if (!isLoading && !user && pathname !== '/login') {
            router.push('/login')
        }
    }, [isLoading, user, pathname, router])

    const logout = () => {
        localStorage.removeItem('userRole')
        localStorage.removeItem('userName')
        setUser(null)
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// Role-based access helpers
export function canAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole)
}

export function getRoleCapabilities(role: UserRole) {
    switch (role) {
        case 'encoder':
            return {
                canCreateTankerDay: true,
                canRecordSnapshot: true,
                canRecordRefill: true,
                canCreateTrip: true,
                canSubmitTankerDay: true,
                canApproveTankerDay: false,
                canLockTankerDay: false,
                canManageMasterData: false,
                canViewAllReports: false,
            }
        case 'validator':
            return {
                canCreateTankerDay: false,
                canRecordSnapshot: false,
                canRecordRefill: false,
                canCreateTrip: false,
                canSubmitTankerDay: false,
                canApproveTankerDay: true,
                canLockTankerDay: true,
                canManageMasterData: false,
                canViewAllReports: true,
            }
        case 'supervisor':
            return {
                canCreateTankerDay: false,
                canRecordSnapshot: false,
                canRecordRefill: false,
                canCreateTrip: false,
                canSubmitTankerDay: false,
                canApproveTankerDay: true,
                canLockTankerDay: true,
                canManageMasterData: false,
                canViewAllReports: true,
            }
        case 'admin':
            return {
                canCreateTankerDay: true,
                canRecordSnapshot: true,
                canRecordRefill: true,
                canCreateTrip: true,
                canSubmitTankerDay: true,
                canApproveTankerDay: true,
                canLockTankerDay: true,
                canManageMasterData: true,
                canViewAllReports: true,
            }
    }
}

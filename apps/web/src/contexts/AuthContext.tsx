'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getAuthMe, postAuthLogout } from '@/api/generated/認証/認証';
import type { User } from '@/api/models';

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: () => Promise<void>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refreshUser = useCallback(async () => {
		try {
			const response = await getAuthMe();
			if (response.status === 200 && 'data' in response) {
				setUser(response.data);
			} else {
				setUser(null);
			}
		} catch (_error) {
			setUser(null);
		}
	}, []);

	const login = useCallback(async () => {
		await refreshUser();
	}, [refreshUser]);

	const logout = useCallback(async () => {
		try {
			await postAuthLogout();
		} catch (_error) {
			// ignore logout errors
		} finally {
			setUser(null);
		}
	}, []);

	// 初回マウント時にユーザー情報を取得
	useEffect(() => {
		const initAuth = async () => {
			setIsLoading(true);
			await refreshUser();
			setIsLoading(false);
		};
		initAuth();
	}, [refreshUser]);

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated: !!user,
		login,
		logout,
		refreshUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

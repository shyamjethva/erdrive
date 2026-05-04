import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [activeSpace, setActiveSpace] = useState('main');
    const [spaceToken, setSpaceToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = sessionStorage.getItem('user');
            const token = sessionStorage.getItem('token');
            const storedSpace = sessionStorage.getItem('activeSpace');
            const storedSpaceToken = sessionStorage.getItem('spaceToken');

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            if (storedSpace === 'primary') {
                setActiveSpace('main');
                sessionStorage.setItem('activeSpace', 'main');
            } else if (storedSpace) {
                setActiveSpace(storedSpace);
            }

            if (storedSpaceToken) {
                setSpaceToken(storedSpaceToken);
            }

            // Immediately stop loading if we have cached data or no token
            if (storedUser || !token) {
                setLoading(false);
            }

            if (token) {
                try {
                    // Fetch latest user data from server on refresh in background
                    const response = await api.get('/auth/me');
                    const latestUser = response.data;
                    setUser(latestUser);
                    sessionStorage.setItem('user', JSON.stringify(latestUser));
                } catch (err) {
                    if (err.response?.status === 401 || err.response?.status === 403) {
                        logout();
                    }
                } finally {
                    setLoading(false);
                }
            }
        };

        initializeAuth();
    }, []);

    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        const { user, token } = response.data;

        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const initializeSecondSpace = async (password) => {
        const response = await api.post('/auth/second-space/init', { password });
        const { user } = response.data;
        setUser(user);
        sessionStorage.setItem('user', JSON.stringify(user));
        return user;
    };

    const verifySpacePassword = async (password, useMainPassword = false) => {
        const response = await api.post('/auth/second-space/auth', { password, useMainPassword });
        if (response.data.spaceToken) {
            setSpaceToken(response.data.spaceToken);
            sessionStorage.setItem('spaceToken', response.data.spaceToken);
            setActiveSpace('second');
            sessionStorage.setItem('activeSpace', 'second');
        }
        return response.data;
    };

    const toggleSpace = (space) => {
        setActiveSpace(space);
        sessionStorage.setItem('activeSpace', space);
        if (space === 'main') {
            setSpaceToken(null);
            sessionStorage.removeItem('spaceToken');
        }
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('activeSpace');
        sessionStorage.removeItem('spaceToken');
        setUser(null);
        setSpaceToken(null);
        setActiveSpace('main');
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            login,
            logout,
            loading,
            activeSpace,
            spaceToken,
            toggleSpace,
            initializeSecondSpace,
            verifySpacePassword
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

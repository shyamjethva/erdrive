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
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            const storedSpace = localStorage.getItem('activeSpace');
            const storedSpaceToken = localStorage.getItem('spaceToken');

            if (token) {
                try {
                    // Fetch latest user data from server on refresh
                    const response = await api.get('/auth/me');
                    const latestUser = response.data;
                    setUser(latestUser);
                    localStorage.setItem('user', JSON.stringify(latestUser));
                } catch (err) {
                    // console.error('Failed to fetch user profile:', err);
                    if (storedUser) setUser(JSON.parse(storedUser));
                }
            } else if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            if (storedSpace === 'primary') {
                setActiveSpace('main');
                localStorage.setItem('activeSpace', 'main');
            } else if (storedSpace) {
                setActiveSpace(storedSpace);
            }

            if (storedSpaceToken) {
                setSpaceToken(storedSpaceToken);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        const { user, token } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const initializeSecondSpace = async (password) => {
        const response = await api.post('/auth/second-space/init', { password });
        const { user } = response.data;
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    };

    const verifySpacePassword = async (password, useMainPassword = false) => {
        const response = await api.post('/auth/second-space/auth', { password, useMainPassword });
        if (response.data.spaceToken) {
            setSpaceToken(response.data.spaceToken);
            localStorage.setItem('spaceToken', response.data.spaceToken);
            setActiveSpace('second');
            localStorage.setItem('activeSpace', 'second');
        }
        return response.data;
    };

    const toggleSpace = (space) => {
        setActiveSpace(space);
        localStorage.setItem('activeSpace', space);
        if (space === 'main') {
            setSpaceToken(null);
            localStorage.removeItem('spaceToken');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeSpace');
        localStorage.removeItem('spaceToken');
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

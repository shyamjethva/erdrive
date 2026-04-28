import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isSecondSpace, setIsSecondSpace] = useState(sessionStorage.getItem('isSecondSpace') === 'true');
    const [loading, setLoading] = useState(true);

    const setSecondSpaceMode = (mode) => {
        sessionStorage.setItem('isSecondSpace', mode);
        setIsSecondSpace(mode);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        const { user, token } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('isSecondSpace');
        setUser(null);
        setIsSecondSpace(false);
    };

    const activeUsername = React.useMemo(() => {
        if (!user) return isSecondSpace ? 'User' : '';
        return isSecondSpace ? (user.secondSpaceUsername || 'User') : user.username;
    }, [user, isSecondSpace]);

    const activeAvatar = React.useMemo(() => {
        if (!user) return null;
        return isSecondSpace ? user.secondSpaceAvatar : user.avatar;
    }, [user, isSecondSpace]);

    const activeEmail = React.useMemo(() => {
        if (!user) return '';
        return isSecondSpace ? (user.secondSpaceEmail || user.email) : user.email;
    }, [user, isSecondSpace]);

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            loading,
            logout,
            isSecondSpace,
            setSecondSpaceMode,
            activeUsername,
            activeAvatar,
            activeEmail
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

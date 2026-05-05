import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SignInComponent from '../components/ui/travel-connect-signin-1';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        // Show message if it takes a long time (likely spinning up a cold server)
        const timeoutId = setTimeout(() => {
            setError('Server is waking up. This may take up to 50 seconds...');
        }, 5000);

        try {
            await login(username, password);
            clearTimeout(timeoutId);
            navigate('/');
        } catch (err) {
            clearTimeout(timeoutId);
            setError(err.response?.data?.error || 'Failed to login. Please check credentials.');
        } finally {
            clearTimeout(timeoutId);
            setIsSubmitting(false);
        }
    };

    return (
        <SignInComponent 
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            onSubmit={handleSubmit}
            error={error}
            isSubmitting={isSubmitting}
        />
    );
};

export default Login;

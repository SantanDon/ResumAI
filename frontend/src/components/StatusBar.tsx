import React from 'react';

interface StatusBarProps {
    status: string;
    type?: 'loading' | 'success' | 'error';
}

export const StatusBar: React.FC<StatusBarProps> = ({ status, type = 'loading' }) => {
    const bgClass = {
        loading: 'bg-blue-600',
        success: 'bg-green-600',
        error: 'bg-red-600',
    }[type];

    return (
        <div className={`glass-dark rounded-xl p-4 mt-4 text-center ${bgClass}`}>
            <p className="text-white font-medium">{status}</p>
        </div>
    );
};

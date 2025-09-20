
import React from 'react';
import { LoadingSpinner } from './icons';

interface StatusBarProps {
  message: string;
  isLoading: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ message, isLoading }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-3 z-50">
      <div className="container mx-auto flex items-center justify-center text-sm">
        {isLoading && <LoadingSpinner className="w-4 h-4 mr-3" />}
        <span className="text-gray-300">{message}</span>
      </div>
    </div>
  );
};

export default StatusBar;

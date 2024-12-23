import React from 'react';

const FeatureButton = ({ featureName, onClick }) => {
    return (
        <button 
            className="w-full h-24 bg-blue-500 text-white text-lg font-bold rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
            onClick={onClick}
        >
            {featureName}
        </button>
    );
};

export default FeatureButton;
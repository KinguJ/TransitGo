import React from 'react';

const TransitCard = ({ name, cardNumber, balance, expiryDate }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
          <span className="text-sm text-gray-500">Expires: {expiryDate}</span>
        </div>
        <div className="text-gray-600 font-mono">{cardNumber}</div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Balance</span>
          <span className="text-xl font-bold text-green-600">${balance}</span>
        </div>
      </div>
    </div>
  );
};

export default TransitCard; 
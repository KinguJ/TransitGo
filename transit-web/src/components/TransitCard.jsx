import React from 'react';
import { useAuth } from '../context/AuthContext';

const TransitCard = ({ name, cardNumber, balance, expiryDate, isAddCard, onLoginClick }) => {
  const { user } = useAuth();

  if (isAddCard) {
    if (!user) {
      return (
        <div 
          onClick={onLoginClick}
          className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-500 cursor-pointer transition-colors"
        >
          <div className="text-center">
            <p className="text-gray-600 mb-2">Please login to add cards</p>
            <span className="text-sm text-gray-500">Click to login</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-500 cursor-pointer transition-colors">
        <div className="text-center">
          <span className="block text-3xl text-gray-400 mb-2">+</span>
          <span className="text-gray-600">Add New Card</span>
        </div>
      </div>
    );
  }

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
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';

// TransitCard component - moved from separate file
const TransitCard = ({ id, name, cardNumber, balance, expiryDate, isAddCard, onLoginClick, onEdit }) => {
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
    <div 
      onClick={() => onEdit(id, name, balance)}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
          <span className="text-sm text-gray-500">Expires: {expiryDate}</span>
        </div>
        <div className="text-gray-600 font-mono">{cardNumber}</div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Balance</span>
          <span className="text-xl font-bold text-green-600">₺{balance}</span>
        </div>
      </div>
    </div>
  );
};

const TransitCards = ({ onLoginClick }) => {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState({ show: false, card: null });
  const [editForm, setEditForm] = useState({ name: '', topUpAmount: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserCards();
    }
  }, [user]);

  const fetchUserCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/cards');
      setCards(response.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
      setError('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (cardNumber) => {
    // Format 16-digit number as **** **** **** 1234
    if (!cardNumber || cardNumber.length !== 16) return cardNumber;
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  const formatExpiryDate = (date) => {
    if (!date) return '';
    const expiryDate = new Date(date);
    return expiryDate.toLocaleDateString('en-US', { 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const handleEditCard = (cardId, currentName, currentBalance) => {
    const card = cards.find(c => c._id === cardId);
    setEditModal({ show: true, card });
    setEditForm({ name: currentName, topUpAmount: '' });
  };

  const handleSaveEdit = async () => {
    if (!editModal.card) return;

    try {
      setUpdating(true);
      setError(null);

      const updateData = {};
      
      // Only update name if it's different
      if (editForm.name !== editModal.card.name) {
        updateData.name = editForm.name;
      }

      // Only update balance if top-up amount is provided
      if (editForm.topUpAmount && parseFloat(editForm.topUpAmount) > 0) {
        updateData.balance = editModal.card.balance + parseFloat(editForm.topUpAmount);
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        const response = await axios.put(`/cards/${editModal.card._id}`, updateData);
        
        // Update the cards state with the new data
        setCards(prevCards => 
          prevCards.map(card => 
            card._id === editModal.card._id ? response.data : card
          )
        );
      }

      setEditModal({ show: false, card: null });
      setEditForm({ name: '', topUpAmount: '' });
    } catch (error) {
      console.error('Error updating card:', error);
      setError('Failed to update card');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModal({ show: false, card: null });
    setEditForm({ name: '', topUpAmount: '' });
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Transit Cards</h2>
          <p className="text-gray-600">Manage your transit cards and check balances</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TransitCard 
            isAddCard={true} 
            onLoginClick={onLoginClick}
          />
        </div>
      </section>
    );
  }

  // If user is logged in but loading
  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Transit Cards</h2>
          <p className="text-gray-600">Manage your transit cards and check balances</p>
        </div>
        
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your cards...</p>
          </div>
        </div>
      </section>
    );
  }

  // If error occurred
  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Transit Cards</h2>
          <p className="text-gray-600">Manage your transit cards and check balances</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Cards</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUserCards}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // If user has no cards
  if (cards.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Transit Cards</h2>
          <p className="text-gray-600">Manage your transit cards and check balances</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="text-blue-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-800 mb-2">No Transit Cards Yet</h3>
          <p className="text-blue-600 mb-4">
            You can get your transit card at any station or from our customer service centers.
          </p>
          <div className="text-sm text-blue-500">
            <p>💳 Visit any metro/bus station</p>
            <p>🏢 Customer service centers</p>
            <p>📱 Mobile app (coming soon)</p>
          </div>
        </div>
      </section>
    );
  }

  // Show user's cards
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Your Transit Cards</h2>
        <p className="text-gray-600">Manage your transit cards and check balances</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <TransitCard
            key={card._id}
            id={card._id}
            name={card.name}
            cardNumber={formatCardNumber(card.cardNumber)}
            balance={card.balance.toFixed(2)}
            expiryDate={formatExpiryDate(card.expiryDate)}
            onEdit={handleEditCard}
          />
        ))}
        
        {/* Add Card option - could be expanded later */}
        <div className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-500 cursor-pointer transition-colors">
          <div className="text-center">
            <span className="block text-3xl text-gray-400 mb-2">+</span>
            <span className="text-gray-600">Get New Card</span>
            <p className="text-xs text-gray-500 mt-1">Visit any station</p>
          </div>
        </div>
      </div>

      {/* Edit Card Modal */}
      {editModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Card</h3>
            
            <div className="space-y-4">
              {/* Card Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter card name"
                />
              </div>

              {/* Current Balance Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Balance
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-800">
                  ₺{editModal.card?.balance?.toFixed(2) || '0.00'}
                </div>
              </div>

              {/* Top Up Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Top Up Amount
                </label>
                <input
                  type="number"
                  value={editForm.topUpAmount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, topUpAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {editForm.topUpAmount && parseFloat(editForm.topUpAmount) > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    New balance: ₺{(editModal.card?.balance + parseFloat(editForm.topUpAmount)).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                disabled={updating}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updating || (!editForm.name.trim() && !editForm.topUpAmount)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TransitCards; 
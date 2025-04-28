import React, { useState } from 'react';

const TripPlanner = () => {
  const [tripDetails, setTripDetails] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
    time: 'now'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTripDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Planning trip:', tripDetails);
  };

  const handleClear = () => {
    setTripDetails({
      from: '',
      to: '',
      date: new Date().toISOString().split('T')[0],
      time: 'now'
    });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Trip Planner</h2>
        <p className="text-gray-600">Plan your journey from start to destination</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* From Location */}
            <div>
              <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                From
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  📍
                </span>
                <input
                  type="text"
                  name="from"
                  id="from"
                  value={tripDetails.from}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter starting point"
                />
              </div>
            </div>

            {/* To Location */}
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                To
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  📍
                </span>
                <input
                  type="text"
                  name="to"
                  id="to"
                  value={tripDetails.to}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter destination"
                />
              </div>
            </div>

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={tripDetails.date}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                  Time
                </label>
                <select
                  name="time"
                  id="time"
                  value={tripDetails.time}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="now">Depart Now</option>
                  <option value="morning">Morning (6AM - 10AM)</option>
                  <option value="afternoon">Afternoon (12PM - 4PM)</option>
                  <option value="evening">Evening (5PM - 9PM)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Clear
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Plan My Trip
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default TripPlanner; 
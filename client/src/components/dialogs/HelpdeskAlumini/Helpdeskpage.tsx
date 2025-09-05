// src/pages/HelpDesk.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HelpDesk: React.FC = () => {
  const [institution, setInstitution] = useState('');
  const [service, setService] = useState('');
  const navigate = useNavigate();

  const handleNext = () => {
    if (!institution) {
      alert('Please select an institution');
      return;
    }
    if (!service) {
      alert('Please select a service');
      return;
    }

    // Navigate based on service value
    switch (service) {
      case 'contact':
        navigate('/contact', { state: { institution } });
        break;
      case 'id_card':
        navigate('/alumni-id-card');
        break;
      case 'verification':
        navigate('/degree-verification');
        break;
      case 'events':
        navigate('/event-registration');
        break;
      case 'donation':
        navigate('/make-donation');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start pt-24 px-4">
      <div className="backdrop-blur-sm bg-white/70 border border-blue-100 shadow-2xl rounded-2xl max-w-xl w-full p-10">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">
          Manage Alumini Related Quaries
        </h2>
        <p className="text-gray-700 mb-6">
          Go to destination for all alumini-related quaries
        </p>

        <p className="text-gray-800 font-medium mb-4">
          Please select the service you would like to avail:
        </p>

        {/* Institution Dropdown */}
        <div className="mb-5">
          <label htmlFor="institution" className="block text-sm font-semibold text-gray-800 mb-1">
            Institution <span className="text-red-500">*</span>
          </label>
          <select
            id="institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 shadow-sm"
            required
          >
            <option value="">Select Institution</option>
            <option value="College of Engineering">College of Engineering</option>
            <option value="School of Business">School of Business</option>
            <option value="Arts and Sciences">Arts and Sciences</option>
            <option value="Medical School">Medical School</option>
            <option value="Law School">Law School</option>
          </select>
        </div>

        {/* Services Dropdown */}
        <div className="mb-8">
          <label htmlFor="services" className="block text-sm font-semibold text-gray-800 mb-1">
            Services
          </label>
          <select
            id="services"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 shadow-sm"
          >
            <option value="">Select Service</option>
            <option value="contact">Contact</option>
            <option value="id_card">Alumni ID Card</option>
            <option value="verification">Degree Verification</option>
            <option value="events">Event Registration</option>
            <option value="donation">Make a Donation</option>
          </select>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default HelpDesk;

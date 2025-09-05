import React, { useState } from 'react';
import CustomDropdown from './Customdropdown'; // adjust path

const HelpDesk: React.FC = () => {
  const [institution, setInstitution] = useState('');
  const [service, setService] = useState('');

  const institutions = [
    { value: 'engineering', label: 'College of Engineering' },
    { value: 'business', label: 'School of Business' },
    { value: 'arts', label: 'Arts and Sciences' },
    { value: 'medical', label: 'Medical School' },
    { value: 'law', label: 'Law School' },
  ];

  const services = [
    { value: 'transcript', label: 'Request Transcript' },
    { value: 'id_card', label: 'Alumni ID Card' },
    { value: 'verification', label: 'Degree Verification' },
    { value: 'events', label: 'Event Registration' },
    { value: 'donation', label: 'Make a Donation' },
  ];

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

        {/* Custom Dropdowns */}
        <CustomDropdown
          label="Institution"
          options={institutions}
          onChange={(val) => setInstitution(val)}
          required
        />

        <CustomDropdown
          label="Services"
          options={services}
          onChange={(val) => setService(val)}
        />

        {/* Next Button */}
        <button
          type="button"
          className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default HelpDesk;

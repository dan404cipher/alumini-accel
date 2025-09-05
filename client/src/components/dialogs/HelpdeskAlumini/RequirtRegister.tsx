import React, { useState, useRef } from 'react';

const RequirtRegister: React.FC = () => {
  const messageRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    contactNo: '',
    company: '',
    role: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'message' && messageRef.current) {
      messageRef.current.style.height = 'auto';
      messageRef.current.style.height = `${messageRef.current.scrollHeight}px`;
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.contactNo.trim()) newErrors.contactNo = 'Contact number is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    alert('Form submitted successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 flex justify-center items-start">
      <div className="bg-white shadow-2xl rounded-3xl p-10 max-w-5xl w-full">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
          Please fill out the form
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 border rounded-xl shadow-sm transition focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Personal Email ID <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={`w-full px-4 py-3 border rounded-xl shadow-sm transition focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Institution */}
            <div>
              <label className="block font-medium mb-1 text-gray-700">Institution Name</label>
              <input
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                placeholder="Institution or University"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contact No */}
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Contact No. <span className="text-red-500">*</span>
              </label>
              <input
                name="contactNo"
                type="tel"
                value={formData.contactNo}
                onChange={handleChange}
                placeholder="Phone number"
                className={`w-full px-4 py-3 border rounded-xl shadow-sm transition focus:outline-none focus:ring-2 ${
                  errors.contactNo ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.contactNo && <p className="text-sm text-red-500 mt-1">{errors.contactNo}</p>}
            </div>

            {/* Company Name */}
            <div>
              <label className="block font-medium mb-1 text-gray-700">Company Name</label>
              <input
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company or Organization"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block font-medium mb-1 text-gray-700">Designation / Role</label>
              <input
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="Your job title"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Message */}
          <div className="mt-6">
            <label className="block font-medium mb-1 text-gray-700">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={messageRef}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Type your message here..."
              className={`w-full min-h-[100px] max-h-[300px] px-5 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md overflow-y-auto resize-none ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message}</p>}
          </div>

          {/* Submit */}
          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-10 rounded-xl shadow-lg transition"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequirtRegister;

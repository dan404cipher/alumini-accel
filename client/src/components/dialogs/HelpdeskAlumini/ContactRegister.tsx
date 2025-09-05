import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ContactRegister: React.FC = () => {
  const location = useLocation();
  const institutionFromState = (location.state as { institution: string })?.institution || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    contactNo: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, institution: institutionFromState }));
  }, [institutionFromState]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-expand message box
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
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
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
    <div className="max-w-6xl mx-auto p-8 bg-white ">
      <h2 className="text-4xl font-extrabold text-center text-blue-700 mb-12 drop-shadow-md">
        Get in Touch
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Institution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution
              </label>
              <input
                name="institution"
                value={formData.institution}
                readOnly
                className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Contact No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact No. <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleChange}
                placeholder="+1234567890"
                className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md ${
                  errors.contactNo ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.contactNo && <p className="text-sm text-red-500 mt-1">{errors.contactNo}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Message subject"
                className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md ${
                  errors.subject ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.subject && <p className="text-sm text-red-500 mt-1">{errors.subject}</p>}
            </div>

            {/* Message with auto-resize */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
             <textarea
  ref={messageRef}
  name="message"
  value={formData.message}
  onChange={handleChange}
  placeholder="Type your message here..."
  className={`w-full min-h-[5px] max-h-[300px] px-5 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md overflow-y-auto resize-none ${
    errors.message ? 'border-red-500' : 'border-gray-300'
  }`}
/>
              {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message}</p>}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-12">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-10 py-3 rounded-full shadow-lg transition-transform transform hover:scale-105 duration-200"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactRegister;

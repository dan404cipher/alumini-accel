import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ✅ Funds array for dynamic title
const funds = [
  { id: 1, title: "A Classroom (Hall) Named with Gratitude" },
  { id: 2, title: "Empowering Scholars: Help Fund Their Journey" },
  { id: 3, title: "Rank Holders Endowment Fund" },
  { id: 4, title: "Emergency Medical Fund for Student Parents" },
  { id: 5, title: "Chair Professorship Initiative" },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  amount: string;
  course: string;
  stream: string;
  endYear: string;
  building: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

const ContributionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const fund = funds.find((f) => f.id === Number(id));

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    amount: "",
    course: "",
    stream: "",
    endYear: "",
    building: "",
    locality: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Validate each field
  const validateField = (name: string, value: string) => {
    let error = "";

    // Required fields except notes
    if (!value && name !== "notes") error = "This field is required";

    // Email format
    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) error = "Invalid email format";
    }

    // Contact number: 10 digits
    if (name === "contact" && value) {
      if (value.length !== 10) error = "Contact must be 10 digits";
    }

    // Amount > 0
    if (name === "amount" && value) {
      const numeric = Number(value.replace(/,/g, ""));
      if (numeric <= 0) error = "Amount must be greater than 0";
    }

    // End Year: 4 digits
    if (name === "endYear" && value) {
      if (value.length !== 4) error = "End Year must be 4 digits";
    }

    // Pincode: 6 digits
    if (name === "pincode" && value) {
      if (value.length !== 6) error = "Pincode must be 6 digits";
    }

    // Letters-only fields
    if (
      ["firstName", "lastName", "course", "stream", "city", "state", "country", "locality"].includes(name) &&
      value
    ) {
      if (!/^[A-Za-z]+$/.test(value)) error = "Only letters allowed, no spaces";
    }

    return error;
  };

  // Handle text & number inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let { name, value } = e.target;

    // Letters-only fields: remove numbers, spaces, symbols
    if (
      ["firstName", "lastName", "course", "stream", "city", "state", "country", "locality"].includes(name)
    ) {
      value = value.replace(/[^A-Za-z]/g, "");
    }

    // Number-only fields
    if (["contact", "pincode", "endYear"].includes(name)) {
      value = value.replace(/\D/g, "");
    }

    // Amount formatting
    if (name === "amount") {
      value = value.replace(/[^\d.]/g, ""); // only digits & dot
      const [intPart, decimalPart] = value.split(".");
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      value = decimalPart !== undefined ? `${formattedInt}.${decimalPart}` : formattedInt;
    }

    setFormData({ ...formData, [name]: value });

    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Form Submitted:", formData);
      alert("Form submitted successfully!");
    } else {
      alert("Please fix the errors before submitting.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate("/funds")}
        >
          ← Back to Funds
        </Button>

        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {fund ? fund.title : "Contribution"}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Thank you for choosing to contribute towards this fund.
              <br />
              <span className="font-semibold">For queries contact:</span>
              <br />
              AlumiAccel, 9884848751, 9042648751
              <br />
              feedback.aluminiaccel.ac.in
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount */}
              <div>
                <Label>
                  Amount <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 font-medium">INR</span>
                  <Input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
                </div>
                <div>
                  <Label>
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email + Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>
                <div>
                  <Label>
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    className={errors.contact ? "border-red-500" : ""}
                  />
                  {errors.contact && <p className="text-red-500 text-sm">{errors.contact}</p>}
                </div>
              </div>

              {/* Course / Stream / End Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Course / Degree</Label>
                  <Input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    placeholder="MSC"
                  />
                </div>
                <div>
                  <Label>Stream</Label>
                  <Input
                    type="text"
                    name="stream"
                    value={formData.stream}
                    onChange={handleChange}
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <Label>End Year</Label>
                  <Input
                    type="text"
                    name="endYear"
                    value={formData.endYear}
                    onChange={handleChange}
                    placeholder="YYYY"
                  />
                  {errors.endYear && <p className="text-red-500 text-sm">{errors.endYear}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <Label>
                  Building No. & Street <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  className={errors.building ? "border-red-500" : ""}
                />
                {errors.building && <p className="text-red-500 text-sm">{errors.building}</p>}
              </div>
              <div>
                <Label>
                  Locality <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="locality"
                  value={formData.locality}
                  onChange={handleChange}
                  className={errors.locality ? "border-red-500" : ""}
                />
                {errors.locality && <p className="text-red-500 text-sm">{errors.locality}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                </div>
                <div>
                  <Label>
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={errors.state ? "border-red-500" : ""}
                  />
                  {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={errors.country ? "border-red-500" : ""}
                  />
                  {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
                </div>
                <div>
                  <Label>
                    Pincode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6-digit pincode"
                    className={errors.pincode ? "border-red-500" : ""}
                  />
                  {errors.pincode && <p className="text-red-500 text-sm">{errors.pincode}</p>}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Please Add Instructions / Notes if any</Label>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-blue-600 text-white">
                Submit Contribution
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContributionPage;

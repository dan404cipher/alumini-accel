import React, { useState } from "react";
import { Heart, X, AlertCircle, ExternalLink } from "lucide-react";
import { DonationModalProps, PaymentMethod } from "../types";

const PaymentMethodRadio: React.FC<{
  value: PaymentMethod;
  checked: boolean;
  onChange: (value: PaymentMethod) => void;
}> = ({ value, checked, onChange }) => (
  <label
    className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-all ${
      checked
        ? "border-indigo-400 bg-indigo-50 bg-opacity-40"
        : "border-gray-300 hover:bg-gray-50"
    }`}
    onClick={() => onChange(value)}
  >
    <input
      type="radio"
      name="paymentMethod"
      value={value}
      checked={checked}
      onChange={() => onChange(value)}
      className="sr-only"
    />
    {checked && (
      <div className="text-indigo-600 text-xs font-semibold">Selected</div>
    )}
    <div className={`text-sm ${checked ? "text-gray-900" : "text-gray-600"}`}>
      {value === "UPI" && "UPI/SBID"}
      {value === "Credit Card" && "Credit/Debit Card"}
      {value === "Bank Transfer" && "Net Banking/IMPS"}
      {value === "Net Banking" && "Net Banking"}
    </div>
  </label>
);

const DonationModal: React.FC<DonationModalProps> = ({
  open,
  onClose,
  campaign,
  campaignIndex,
}) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [taxDeductible, setTaxDeductible] = useState(true);

  const quickAmounts = [100, 250, 500, 1000];
  const customAmount = parseInt(amount.split(",").join(""));
  const isValidAmount = typeof customAmount === "number" && customAmount >= 1;

  const handleAmountChange = (value: string) => {
    let formatted = value.split(",").join("");
    const numeric = parseInt(formatted);
    if (!isNaN(numeric) && numeric > 0) {
      formatted = numeric.toLocaleString("en-IN");
    } else if (value !== "") formatted = "";
    setAmount(formatted);
  };

  const handleSubmit = () => {
    const customAmount = parseInt(amount.split(",").join(""));
    if (!isValidAmount) {
      alert("Invalid amount");
      return;
    }

    // Emit donation event - parent component will handle the actual donation
    const customEvent = new CustomEvent("donationConfirm", {
      detail: { amount: customAmount, paymentMethod, taxDeductible },
    });
    window.dispatchEvent(customEvent);

    handleClose();
  };

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  if (!open || !campaign) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md sm:max-w-lg relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Donate to Campaign</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Campaign Info */}
        <div className="p-4">
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-28 object-cover rounded-xl mb-4"
          />
          <h3 className="font-semibold text-gray-900 text-base leading-tight">
            {campaign.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{campaign.category}</p>
        </div>

        {/* Amount */}
        <div className="px-4 pb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (₹)
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                className={`px-3 py-3 rounded-lg border text-sm font-medium ${
                  amount === amt.toLocaleString("en-IN")
                    ? "border-indigo-400 bg-indigo-50 bg-opacity-60"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setAmount(amt.toLocaleString("en-IN"))}
              >
                ₹{amt.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Other Amount
            </label>
            <input
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Custom amount"
              className="mt-1.5 w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            {/* Suggested Amounts */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Suggest:</span>
              {[2000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    amount === amt.toLocaleString("en-IN")
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setAmount(amt.toLocaleString("en-IN"))}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="px-4 pb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="space-y-2">
            <PaymentMethodRadio
              value={"UPI" as PaymentMethod}
              checked={paymentMethod === "UPI"}
              onChange={(v) => setPaymentMethod(v)}
            />
            <PaymentMethodRadio
              value={"Credit Card" as PaymentMethod}
              checked={paymentMethod === "Credit Card"}
              onChange={(v) => setPaymentMethod(v)}
            />
            <PaymentMethodRadio
              value={"Bank Transfer" as PaymentMethod}
              checked={paymentMethod === "Bank Transfer"}
              onChange={(v) => setPaymentMethod(v)}
            />
            <PaymentMethodRadio
              value={"Net Banking" as PaymentMethod}
              checked={paymentMethod === "Net Banking"}
              onChange={(v) => setPaymentMethod(v)}
            />
          </div>
        </div>

        {/* Tax Deductible */}
        <div className="px-4 pb-4">
          <div className="flex items-start gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxDeductible}
                onChange={(e) => setTaxDeductible(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-gray-600">
                Make this donation{" "}
                <span className="font-medium text-gray-900">
                  tax-deductible
                </span>
              </span>
            </label>
            <button className="text-gray-400 hover:text-gray-500">
              <AlertCircle size={14} />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 pb-4">
          <div className="border rounded-lg p-3 bg-gray-50 bg-opacity-40">
            <div className="flex justify-between items-center text-sm">
              <span
                className={`font-medium ${
                  isValidAmount ? "text-gray-700" : "text-gray-500"
                }`}
              >
                Contribution:
              </span>
              <span
                className={`font-bold ${
                  isValidAmount ? "text-gray-900 text-base" : "text-gray-500"
                }`}
              >
                {isValidAmount
                  ? `₹${customAmount.toLocaleString("en-IN")}`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
              <span>Platform fees:</span>
              <span>₹0</span>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="font-bold text-gray-900">
                {isValidAmount
                  ? `₹${customAmount.toLocaleString("en-IN")}`
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0">
          <button
            onClick={handleSubmit}
            disabled={!isValidAmount}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm disabled:hover:bg-indigo-500"
          >
            <Heart size={16} />
            Proceed to Payment
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 pt-0 pb-4">
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            Secure payment powered by{" "}
            <a
              href="https://razorpay.com/"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Razorpay <ExternalLink size={12} />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;

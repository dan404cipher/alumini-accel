import React, { useState } from "react";
import { Heart, Share2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DonationCardProps } from "../types";
import { formatINR, calculateProgressPercentage } from "../utils";

const DonationCard: React.FC<DonationCardProps> = ({
  category,
  status,
  imageUrl,
  title,
  description,
  raisedAmount,
  targetAmount,
  donorsCount,
  by,
  endDateLabel,
  onDonate,
  onEdit,
  onDelete,
  onShare,
  onViewDetails,
}) => {
  const percent = calculateProgressPercentage(raisedAmount, targetAmount);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden border h-full flex flex-col cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Image Section */}
      <div className="relative flex-shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-40 sm:h-48 object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              status === "Ended"
                ? "bg-red-500 text-white"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6 relative flex-1 flex flex-col">
        {/* Header with Menu */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {/* Only show menu if edit or delete actions are available (admin only) */}
          {(onEdit || onDelete) && (
            <div className="relative">
              <button
                className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border rounded-lg shadow-lg z-10">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-gray-800"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 mt-2 line-clamp-2 text-sm">{description}</p>

        {/* Progress Section */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-xl font-semibold text-gray-900">
            ₹{formatINR(raisedAmount)}
          </div>
          <div className="text-gray-600 font-medium text-sm">{percent}%</div>
        </div>

        <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
          <div className="text-xs">
            <span className="text-gray-500">Target:</span> ₹
            {formatINR(targetAmount)}
          </div>
          <div className="text-xs">{donorsCount} donors</div>
        </div>

     

        {/* Footer Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
          <div className="text-xs">
            <span className="text-gray-500">by</span> {by}
          </div>
          <div className="text-xs">{endDateLabel}</div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 sm:pt-6 flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDonate) onDonate();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm"
          >
            <Heart className="w-3 h-3 sm:w-4 sm:h-4" /> Donate
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onShare) onShare();
            }}
            className="p-3 rounded-xl border text-gray-600 hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationCard;

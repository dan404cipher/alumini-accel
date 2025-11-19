import React, { useState } from "react";
import { Building2, MoreVertical, Pencil, Trash2, TrendingUp } from "lucide-react";
import { Fund } from "../types";
import { formatINR } from "../utils";

interface FundCardProps {
  fund: Fund;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

const FundCard: React.FC<FundCardProps> = ({
  fund,
  onEdit,
  onDelete,
  onView,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden border h-full flex flex-col cursor-pointer"
      onClick={onView}
    >
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{fund.name}</h3>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  fund.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : fund.status === "archived"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {fund.status.charAt(0).toUpperCase() + fund.status.slice(1)}
              </span>
            </div>
          </div>
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    if (onEdit) onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-gray-800"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    if (onDelete) onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
          {fund.description}
        </p>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Raised</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-lg font-bold text-gray-900">
                ₹{formatINR(fund.totalRaised)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Campaigns</span>
            <span className="text-sm font-semibold text-gray-900">
              {fund.campaignCount || fund.campaigns?.length || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundCard;


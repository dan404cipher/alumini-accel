import React from "react";
import {
  Receipt,
  Download,
  Filter,
  Calendar,
  ExternalLink,
  Share,
} from "lucide-react";
import { DonationHistoryItem, Campaign } from "../types";
import {
  formatINR,
  formatDateShort,
  downloadReceipt,
  exportToCSV,
} from "../utils";

interface DonationTableProps {
  items: DonationHistoryItem[];
  campaigns: Campaign[];
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
}

const DonationTable: React.FC<DonationTableProps> = ({
  items,
  campaigns,
  categoryFilter,
  onCategoryFilterChange,
}) => {
  const filteredItems = items.filter(
    (item) =>
      categoryFilter === "" ||
      campaigns[item.campaignIndex]?.category === categoryFilter
  );

  const categories = [...new Set(campaigns.map((c) => c.category))];

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800 uppercase tracking-wide">
            Donation History
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-all">
            <Calendar className="w-4 h-4" />
            Export Period
            <ExternalLink className="w-3 h-3" />
          </button>
          <button className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-all">
            <Share className="w-4 h-4" />
            Share History
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-4 bg-gray-50 bg-opacity-50 p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">By Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="border-gray-300 rounded-md text-sm w-48"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="relative bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 bg-opacity-60">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-600">
                Campaign
              </th>
              <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-gray-600">
                Amount
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-600">
                Date
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-600">
                Status
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-600">
                Method
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-600">
                Tax Deductible
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredItems.map((item) => {
              const campaign = campaigns[item.campaignIndex];
              return (
                <tr
                  className="transition-colors hover:bg-gray-50"
                  key={`item-${item.id}`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.campaignTitle}
                      </div>
                      <div className="text-xs text-gray-500">
                        {campaign?.category || "Unknown"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end font-semibold text-gray-900">
                    ₹{formatINR(item.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {formatDateShort(item.dateISO)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({new Date(item.dateISO).toISOString()})
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium justify-center gap-1`}
                    >
                      <div className={`w-2 h-2 rounded-full`} />
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="block w-9 h-6 bg-gray-200 rounded-sm" />
                      <div className="flex flex-col ml-2">
                        <div className="text-sm font-medium text-gray-900">
                          {item.method}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {item.taxDeductible ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => downloadReceipt(item)}
                      disabled={item.status !== "Completed"}
                      className="inline-flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-700 py-1 px-3 rounded-lg text-sm font-medium transition-all disabled:hover:bg-indigo-100"
                    >
                      <Download className="w-3 h-3" />
                      Receipt
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-sm">
            No donations match the selected filter.
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredItems.length > 0 && (
        <div className="bg-gray-50 bg-opacity-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-sm py-1">
            <span className="text-gray-700">
              <span className="text-gray-700 font-medium">
                {filteredItems.length}
              </span>{" "}
              donations match your filter
            </span>
            <button
              onClick={() => exportToCSV(filteredItems, "donations.csv")}
              className="text-blue-600 hover:underline font-medium"
            >
              Export Filtered
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationTable;

import React, { useState } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FundCard from "./FundCard";
import { Fund } from "../types";
import Pagination from "@/components/ui/pagination";

interface FundListProps {
  funds: Fund[];
  loading?: boolean;
  onCreateClick: () => void;
  onEditClick: (fund: Fund) => void;
  onDeleteClick: (fund: Fund) => void;
  onViewClick: (fund: Fund) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const FundList: React.FC<FundListProps> = ({
  funds,
  loading = false,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onViewClick,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredFunds = funds.filter((fund) => {
    const matchesSearch =
      fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fund.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || fund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border h-64 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search funds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onCreateClick} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Fund
        </Button>
      </div>

      {filteredFunds.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-gray-500">
            {searchQuery || statusFilter !== "all"
              ? "No funds match your filters"
              : "No funds found. Create your first fund to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredFunds.map((fund) => (
              <FundCard
                key={fund._id}
                fund={fund}
                onEdit={() => onEditClick(fund)}
                onDelete={() => onDeleteClick(fund)}
                onView={() => onViewClick(fund)}
              />
            ))}
          </div>
          {totalPages > 1 && onPageChange && (
            <div className="flex justify-center pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FundList;


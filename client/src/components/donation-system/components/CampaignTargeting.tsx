import React, { useState, useEffect } from "react";
import { Users, Search, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CampaignTargetingProps, TargetAudience } from "../types";
import { campaignTargetingAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CampaignTargeting: React.FC<CampaignTargetingProps> = ({
  value,
  onChange,
  onPreview,
}) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<TargetAudience>(value || {});
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [batchYearInput, setBatchYearInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [professionInput, setProfessionInput] = useState("");

  useEffect(() => {
    setFilters(value || {});
  }, [value]);

  const handleFilterChange = (updates: Partial<TargetAudience>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onChange(newFilters);
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      const response = await campaignTargetingAPI.previewAudience(filters);
      if (response.success && response.data) {
        const count = response.data.count || 0;
        setPreviewCount(count);
        if (onPreview) {
          onPreview(count);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to preview audience",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const addBatchYear = () => {
    const year = parseInt(batchYearInput);
    if (year && year >= 1950 && year <= new Date().getFullYear() + 1) {
      const years = filters.batchYears || [];
      if (!years.includes(year)) {
        handleFilterChange({ batchYears: [...years, year] });
        setBatchYearInput("");
      }
    }
  };

  const removeBatchYear = (year: number) => {
    const years = (filters.batchYears || []).filter((y) => y !== year);
    handleFilterChange({ batchYears: years.length > 0 ? years : undefined });
  };

  const addLocation = () => {
    if (locationInput.trim()) {
      const locations = filters.locations || [];
      if (!locations.includes(locationInput.trim())) {
        handleFilterChange({
          locations: [...locations, locationInput.trim()],
        });
        setLocationInput("");
      }
    }
  };

  const removeLocation = (location: string) => {
    const locations = (filters.locations || []).filter((l) => l !== location);
    handleFilterChange({ locations: locations.length > 0 ? locations : undefined });
  };

  const addProfession = () => {
    if (professionInput.trim()) {
      const professions = filters.professions || [];
      if (!professions.includes(professionInput.trim())) {
        handleFilterChange({
          professions: [...professions, professionInput.trim()],
        });
        setProfessionInput("");
      }
    }
  };

  const removeProfession = (profession: string) => {
    const professions = (filters.professions || []).filter(
      (p) => p !== profession
    );
    handleFilterChange({
      professions: professions.length > 0 ? professions : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Target Audience</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={loadingPreview}
        >
          {loadingPreview ? "Loading..." : "Preview Audience"}
        </Button>
      </div>

      {previewCount !== null && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>{previewCount}</strong> alumni match your targeting criteria
          </p>
        </div>
      )}

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="batch">
          <AccordionTrigger>Batch Years</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter graduation year (e.g., 2020)"
                  value={batchYearInput}
                  onChange={(e) => setBatchYearInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBatchYear();
                    }
                  }}
                  min="1950"
                  max={new Date().getFullYear() + 1}
                />
                <Button type="button" onClick={addBatchYear} size="sm">
                  Add
                </Button>
              </div>
              {filters.batchYears && filters.batchYears.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.batchYears.map((year) => (
                    <Badge key={year} variant="secondary" className="gap-1">
                      {year}
                      <button
                        onClick={() => removeBatchYear(year)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="location">
          <AccordionTrigger>Locations</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter location (e.g., Mumbai, New York)"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLocation();
                    }
                  }}
                />
                <Button type="button" onClick={addLocation} size="sm">
                  Add
                </Button>
              </div>
              {filters.locations && filters.locations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.locations.map((location) => (
                    <Badge key={location} variant="secondary" className="gap-1">
                      {location}
                      <button
                        onClick={() => removeLocation(location)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="profession">
          <AccordionTrigger>Professions</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter profession (e.g., Software Engineer, Doctor)"
                  value={professionInput}
                  onChange={(e) => setProfessionInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addProfession();
                    }
                  }}
                />
                <Button type="button" onClick={addProfession} size="sm">
                  Add
                </Button>
              </div>
              {filters.professions && filters.professions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.professions.map((profession) => (
                    <Badge key={profession} variant="secondary" className="gap-1">
                      {profession}
                      <button
                        onClick={() => removeProfession(profession)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="donation">
          <AccordionTrigger>Donation History</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Total Donated</Label>
                <Input
                  type="number"
                  placeholder="Enter minimum amount"
                  value={filters.donationHistory?.minAmount || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      donationHistory: {
                        ...filters.donationHistory,
                        minAmount: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      },
                    })
                  }
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Number of Donations</Label>
                <Input
                  type="number"
                  placeholder="Enter minimum count"
                  value={filters.donationHistory?.minDonations || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      donationHistory: {
                        ...filters.donationHistory,
                        minDonations: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      },
                    })
                  }
                  min="0"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default CampaignTargeting;


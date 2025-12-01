import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageSquare, MapPin, Building, GraduationCap } from "lucide-react";
import { AlumniFlag } from "@/types/alumni360";
import { getImageUrl } from "@/lib/api";

interface AlumniHeaderProps {
  alumni: any;
  flags: AlumniFlag[];
  onMessage?: () => void;
  onEmail?: () => void;
  onCall?: () => void;
}

const flagColors: Record<string, string> = {
  vip: "bg-purple-100 text-purple-800 border-purple-300",
  major_donor: "bg-amber-100 text-amber-800 border-amber-300",
  inactive: "bg-gray-100 text-gray-800 border-gray-300",
  at_risk: "bg-red-100 text-red-800 border-red-300",
  high_engagement: "bg-green-100 text-green-800 border-green-300",
  mentor: "bg-blue-100 text-blue-800 border-blue-300",
  speaker: "bg-indigo-100 text-indigo-800 border-indigo-300",
  volunteer: "bg-teal-100 text-teal-800 border-teal-300",
  custom: "bg-slate-100 text-slate-800 border-slate-300",
};

export const AlumniHeader = ({ alumni, flags, onMessage, onEmail, onCall }: AlumniHeaderProps) => {
  const user = alumni?.userId || alumni?.user || {};
  const profileImage = user.profilePicture || user.profileImage;
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
  const email = user.email || "";
  const phone = user.phone || "";
  const location = user.location || alumni?.currentLocation || "";
  const company = alumni?.currentCompany || "";
  const department = alumni?.department || user.department || "";
  const graduationYear = alumni?.graduationYear || user.graduationYear || "";

  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Profile Image */}
          <div className="relative flex-shrink-0">
            <img
              src={
                profileImage
                  ? getImageUrl(profileImage)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
              }
              alt={name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-background shadow-md"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
              }}
            />
            {flags.length > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{flags.length}</span>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">{name}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
                  {department && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{department}</span>
                    </div>
                  )}
                  {graduationYear && (
                    <span className="hidden sm:inline">• {graduationYear}</span>
                  )}
                  {location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{location}</span>
                    </div>
                  )}
                  {company && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      <span className="truncate">{company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {onEmail && email && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEmail}
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">Email</span>
                  </Button>
                )}
                {onCall && phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCall}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden sm:inline">Call</span>
                  </Button>
                )}
                {onMessage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMessage}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Message</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Flags */}
            {flags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {flags.map((flag) => (
                  <Badge
                    key={flag._id}
                    variant="outline"
                    className={`${flagColors[flag.flagType] || flagColors.custom} text-xs sm:text-sm`}
                  >
                    {flag.flagValue}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


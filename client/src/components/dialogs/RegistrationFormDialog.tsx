import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, IndianRupee } from "lucide-react";
import { eventAPI } from "@/lib/api";
import RazorpayService from "@/services/razorpayService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  price: string;
  maxAttendees: number;
  attendees: number;
}

interface RegistrationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onRegistrationSuccess: () => void;
}

interface RegistrationFormData {
  phone: string;
  dietaryRequirements?: string;
  emergencyContact?: string;
  additionalNotes?: string;
}

export const RegistrationFormDialog = ({
  isOpen,
  onClose,
  event,
  onRegistrationSuccess,
}: RegistrationFormDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<RegistrationFormData>({
    phone: "",
    dietaryRequirements: "",
    emergencyContact: "",
    additionalNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await eventAPI.registerForEvent(event.id, {
        phone: formData.phone,
        dietaryRequirements: formData.dietaryRequirements,
        emergencyContact: formData.emergencyContact,
        additionalNotes: formData.additionalNotes,
      });

      if (res.success && res.data) {
        const data = res.data as {
          status?: string;
          paymentRequired?: boolean;
          amount?: number;
          currency?: string;
        };

        if (data.paymentRequired) {
          // For paid events, create Razorpay order and open checkout
          const paymentAmount = data.amount || 0; // rupees
          const currency = data.currency || "INR";

          if (!user?._id) {
            toast({
              title: "Authentication required",
              description: "Please login again to complete payment.",
              variant: "destructive",
            });
            return;
          }

          try {
            const rp = RazorpayService.getInstance();
            const orderResult = await rp.createEventOrder({
              amount: paymentAmount,
              eventId: event.id,
              userId: user._id,
            });

            if (!orderResult.success || !orderResult.data) {
              toast({
                title: "Payment Error",
                description:
                  orderResult.message || "Could not create payment order.",
                variant: "destructive",
              });
              return;
            }

            const { orderId, amount: orderAmount, keyId } = orderResult.data;

            // Close the dialog before opening Razorpay to avoid overlay/focus trap blocking clicks
            onClose();

            await rp.openPaymentModal({
              key: keyId,
              amount: orderAmount, // paise
              currency,
              name: event.title || "Event Registration",
              description: `Registration for ${event.title || "event"}`,
              order_id: orderId,
              prefill: {
                name: `${(user as any)?.firstName || ""} ${(user as any)?.lastName || ""}`.trim(),
                email: (user as any)?.email,
                contact: formData.phone,
              },
              notes: { eventId: event.id, userId: user._id },
              handler: async (response) => {
                try {
                  const verifyRes = await rp.verifyPayment({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    type: "event",
                    eventId: event.id,
                    userId: user._id,
                  });

                  if (!(verifyRes as any)?.success) {
                    toast({
                      title: "Payment Verification Failed",
                      description:
                        (verifyRes as any).message || "Could not verify payment.",
                      variant: "destructive",
                    });
                    return;
                  }

                  const confirmRes = await eventAPI.confirmRegistration(event.id);
                  if (confirmRes.success) {
                    onRegistrationSuccess();
                    onClose();
                    toast({
                      title: "Registration Confirmed!",
                      description: `Payment of ${currency} ${paymentAmount} processed successfully.`,
                      variant: "default",
                    });
                  } else {
                    toast({
                      title: "Registration Issue",
                      description:
                        "Payment processed but registration confirmation failed. Please contact support.",
                      variant: "destructive",
                    });
                  }
                } catch (err) {
                  toast({
                    title: "Payment Error",
                    description:
                      "Something went wrong while processing payment.",
                    variant: "destructive",
                  });
                }
              },
            });
          } catch (err) {
            toast({
              title: "Payment Error",
              description: "Could not initialize payment.",
              variant: "destructive",
            });
          }
        } else {
          // Free event - registration successful
          onRegistrationSuccess();
          onClose();
          toast({
            title: "Registration Successful!",
            description: "You'll receive a confirmation email shortly.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Registration Failed",
          description: res.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof RegistrationFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const isPaidEvent = event && event.price !== "Free";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register for Event</DialogTitle>
        </DialogHeader>

        {event && (
          <div className="space-y-6">
            {/* Event Details Card */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3">{event.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>
                      {event.attendees}/{event.maxAttendees} spots
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    <span className="text-lg font-bold">{event.price}</span>
                  </div>
                  {isPaidEvent && <Badge variant="secondary">Paid Event</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="dietaryRequirements">
                  Dietary Requirements
                </Label>
                <Input
                  id="dietaryRequirements"
                  value={formData.dietaryRequirements}
                  onChange={(e) =>
                    handleInputChange("dietaryRequirements", e.target.value)
                  }
                  placeholder="e.g., Vegetarian, Gluten-free, Allergies"
                />
              </div>

              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    handleInputChange("emergencyContact", e.target.value)
                  }
                  placeholder="Name and phone number"
                />
              </div>

              <div>
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={(e) =>
                    handleInputChange("additionalNotes", e.target.value)
                  }
                  placeholder="Any special requirements or questions..."
                  rows={3}
                />
              </div>

              {/* Payment Notice for Paid Events */}
              {isPaidEvent && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <IndianRupee className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Payment Required
                        </p>
                        <p className="text-sm text-blue-700">
                          You will be redirected to complete payment after
                          submitting this form.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting
                    ? "Processing..."
                    : isPaidEvent
                    ? "Pay & Register"
                    : "Register"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

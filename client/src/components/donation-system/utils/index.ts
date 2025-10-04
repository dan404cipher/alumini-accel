// Donation Management Utility Functions

export const formatINR = (amount: number) =>
  amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const formatDateShort = (iso: string) => {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };
  return d.toLocaleDateString("en-US", opts);
};

// Format like: Ends May 20, 2025
export const formatEndDateLabel = (isoDate: string) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return `Ends ${d.toLocaleDateString("en-US", opts)}`;
};

export const calculateProgressPercentage = (raised: number, target: number) => {
  return Math.min(100, Math.round((raised / target) * 1000) / 10);
};

export const generateReceiptId = () => `REC-${Date.now()}`;

export const generateDonationId = () => `donation_${Date.now()}`;

export const downloadReceipt = (item: any) => {
  if (item.status !== "Completed") return;

  const lines = [
    "Alumni Accel - Donation Receipt",
    "--------------------------------",
    `Receipt ID: ${item.receiptId ?? "TBD"}`,
    `Campaign: ${item.campaignTitle}`,
    `Amount: ₹${formatINR(item.amount)}`,
    `Date: ${formatDateShort(item.dateISO)} (${new Date(
      item.dateISO
    ).toISOString()})`,
    `Payment Method: ${item.method}`,
    `Tax Deductible: ${item.taxDeductible ? "Yes" : "No"}`,
    "",
    "Thank you for your generous contribution!",
  ].join("\n");

  const blob = new Blob([lines], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt_${item.receiptId ?? item.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = [
    "Campaign",
    "Amount",
    "Date",
    "Status",
    "Method",
    "ReceiptId",
    "TaxDeductible",
  ];
  const rows = data.map((d) => [
    d.campaignTitle.split(",").join(" "),
    d.amount.toString(),
    new Date(d.dateISO).toISOString(),
    d.status,
    d.method,
    d.receiptId || "",
    d.taxDeductible ? "Yes" : "No",
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).split('"').join('""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const shareCampaign = async (campaign: any) => {
  try {
    const url = `${window.location.origin}${
      window.location.pathname
    }?campaign=${encodeURIComponent(campaign.title)}`;
    const shareData = {
      title: campaign.title,
      text: campaign.description || "Check out this campaign",
      url,
    } as ShareData;

    const navShare = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    if (typeof navShare.share === "function") {
      await navShare.share(shareData).catch(() => {});
    } else if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(url);
      alert("Share link copied to clipboard");
    } else {
      const temp = document.createElement("input");
      temp.value = url;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      alert("Share link copied to clipboard");
    }
  } catch (err) {
    console.error("Share failed", err);
    alert("Unable to share right now. Please try again.");
  }
};

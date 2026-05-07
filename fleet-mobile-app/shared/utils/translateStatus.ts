export function getStatusTranslationKey(status?: string | null) {
  switch (String(status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_")) {
    case "pending":
      return "status.pending";
    case "done":
      return "status.done";
    case "active":
      return "status.active";
    case "completed":
      return "status.completed";
    case "in_progress":
      return "status.inProgress";
    case "cancelled":
    case "canceled":
      return "status.cancelled";
    case "failed":
      return "status.failed";
    case "scheduled":
      return "status.scheduled";
    case "ongoing":
      return "status.ongoing";
    case "resolved":
      return "status.resolved";
    case "rejected":
      return "status.rejected";
    case "reached":
      return "status.reached";
    case "skipped":
      return "status.skipped";
    default:
      return "status.unknown";
  }
}

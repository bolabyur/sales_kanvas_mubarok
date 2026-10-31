
export function errorMessage(e: any): string {
  if (!e) return "Terjadi kesalahan yang tidak diketahui";
  
  let msg = e.message || e;
  if (typeof msg === "object" && msg.message) msg = msg.message;

  if (Array.isArray(msg)) {
    return msg.map((m: any) => m.message || String(m)).join(", ");
  }

  if (typeof msg === "object") {
    return JSON.stringify(msg);
  }

  return String(msg);
}

export function fieldErrors(e: any): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!e) return errors;
  
  let msg = e.message || e;
  if (typeof msg === "object" && msg.message) msg = msg.message;

  if (Array.isArray(msg)) {
    msg.forEach((m: any) => {
      if (m && m.field && m.message) {
        errors[m.field] = Array.isArray(m.message) ? m.message.join(", ") : String(m.message);
      }
    });
  }
  return errors;
}
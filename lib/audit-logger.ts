export interface ClientAuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | number;
  actor: string;
  role: string;
  details: string;
  timestamp: string;
  hash: string;
  previousHash: string;
}

const STORAGE_KEY = "petro_erp_audit_trail_v1";
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = (hash >>> 0).toString(16).padStart(8, "0");
  return `0x${hex}${Math.abs(hash).toString(16).padStart(12, "f")}`.slice(0, 32);
}

export function getStoredAuditLogs(): ClientAuditLog[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initialLogs: ClientAuditLog[] = [
        {
          id: "AUD-001",
          action: "SAGA_TX_SETTLED",
          entity: "Order",
          entityId: "101",
          actor: "System Orchestrator",
          role: "SAGA_ENGINE",
          details: "2-Phase Commit execution: Inventory allocated, escrow reserved, and dispatch route generated.",
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          previousHash: GENESIS_HASH,
          hash: generateSimpleHash("AUD-001" + GENESIS_HASH),
        },
        {
          id: "AUD-002",
          action: "EPOD_PIN_VERIFIED",
          entity: "Delivery",
          entityId: "TRK-4420",
          actor: "Driver Mark",
          role: "Deliveryman",
          details: "4-Digit PIN cryptographic signature matched. Custody transferred at terminal receptor.",
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          previousHash: generateSimpleHash("AUD-001" + GENESIS_HASH),
          hash: generateSimpleHash("AUD-002" + "TRK-4420"),
        },
        {
          id: "AUD-003",
          action: "HAZMAT_COMPLIANCE_PASS",
          entity: "TankerInspection",
          entityId: "TK-902",
          actor: "Refinery Inspector",
          role: "Admin",
          details: "Flashpoint 52°C, Cetane index 42 confirmed. Grounding safety and seal intact.",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          previousHash: generateSimpleHash("AUD-002" + "TRK-4420"),
          hash: generateSimpleHash("AUD-003" + "TK-902"),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialLogs));
      return initialLogs;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function recordClientAuditEvent(params: {
  action: string;
  entity: string;
  entityId: string | number;
  actor: string;
  role: string;
  details: string;
}): ClientAuditLog {
  const currentLogs = getStoredAuditLogs();
  const previousHash = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1].hash : GENESIS_HASH;
  const id = `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toISOString();
  const hash = generateSimpleHash(`${id}|${params.action}|${params.entity}|${params.entityId}|${params.actor}|${params.details}|${timestamp}|${previousHash}`);

  const newLog: ClientAuditLog = {
    id,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    actor: params.actor,
    role: params.role,
    details: params.details,
    timestamp,
    previousHash,
    hash,
  };

  currentLogs.push(newLog);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLogs));
  }
  return newLog;
}

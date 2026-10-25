
const API_BASE_URL = "https://storvia-api.onrender.com/api";

// Add a warehouse
async function addWarehouse(warehouseData) {
  const response = await fetch(`${API_BASE_URL}/warehouses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(warehouseData)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Request failed");
  }

  return result;
}

// Save slot configuration from inventory.html
async function sendSlotsToBackend(slotData) {
  const response = await fetch(`${API_BASE_URL}/slots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(slotData)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to save slots");
  }

  return result;
}


async function addWarehouse(warehouseData) {
  const response = await fetch(
    "http://localhost:5000/api/warehouses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(warehouseData)
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Request failed");
  }

  return result;
}




// sending slots from inventory.html form to express

async function sendSlotsToBackend(slots) {
  const response = await fetch(
    "http://localhost:5000/api/slots",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ slots })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to send slots");
  }

  return result;
}


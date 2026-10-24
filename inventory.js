
const slotForm = document.getElementById("slotForm");

const slotType = document.getElementById("slotType");
const slotLength = document.getElementById("slotLength");
const slotBreadth = document.getElementById("slotBreadth");
const slotHeight = document.getElementById("slotHeight");
const slotCount = document.getElementById("slotCount");

const CURRENT_USER_KEY = "currentuser";

function getCurrentUser() {
  const savedUser = localStorage.getItem(CURRENT_USER_KEY);

  if (!savedUser) {
    window.location.href = "login.html";
    return null;
  }

  try {
    const user = JSON.parse(savedUser);

    if (!user || !user.email) {
      window.location.href = "login.html";
      return null;
    }

    return user;
  } catch (error) {
    console.error("Invalid current user data:", error);
    window.location.href = "login.html";
    return null;
  }
}

slotForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  const selectedType = slotType.value;
  const length = Number(slotLength.value);
  const breadth = Number(slotBreadth.value);
  const height = Number(slotHeight.value);
  const numberOfSlots = Number(slotCount.value);

  if (!["Small", "Medium", "Large"].includes(selectedType)) {
    alert("Please select a valid slot type.");
    return;
  }

  if (
    !Number.isFinite(length) ||
    !Number.isFinite(breadth) ||
    !Number.isFinite(height) ||
    length <= 0 ||
    breadth <= 0 ||
    height <= 0
  ) {
    alert("Length, breadth and height must be greater than 0.");
    return;
  }

  if (!Number.isInteger(numberOfSlots) || numberOfSlots <= 0) {
    alert("Number of slots must be a positive whole number.");
    return;
  }

  const volume = length * breadth * height;

  const submitButton = slotForm.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;

  try {
    const response = await fetch("http://localhost:5000/api/slots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slotType: selectedType,
        length,
        breadth,
        height,
        numberOfSlots,
        userEmail: currentUser.email
      })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Unable to add slots.");
      return;
    }

    alert(
      result.count +
      " " +
      selectedType +
      " slot(s) added successfully.\n\n" +
      "Slot dimensions: " +
      length +
      " × " +
      breadth +
      " × " +
      height +
      " cm\n\n" +
      "Volume per slot: " +
      volume +
      " cm³"
    );

    slotForm.reset();
  } catch (error) {
    console.error("Save slots request failed:", error);
    alert("Cannot connect to server. Please try again.");
  } finally {
    submitButton.disabled = false;
  }
});

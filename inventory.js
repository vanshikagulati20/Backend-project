const inventoryForm = document.getElementById("inventoryForm");
const productSelect = document.getElementById("product");
const sizeSelect = document.getElementById("size");
const quantityInput = document.getElementById("quantity");

const INVENTORY_KEY = "inventory";
const PRODUCT_KEY = "products";


// Get products created by the product management feature
function getProducts() {
    const savedProducts = localStorage.getItem(PRODUCT_KEY);

    if (savedProducts) {
        return JSON.parse(savedProducts);
    }

    return [];
}


// Get existing inventory
function getInventory() {
    const savedInventory = localStorage.getItem(INVENTORY_KEY);

    if (savedInventory) {
        return JSON.parse(savedInventory);
    }

    return [];
}


// Save inventory
function saveInventory(inventory) {
    localStorage.setItem(
        INVENTORY_KEY,
        JSON.stringify(inventory)
    );
}


// Load products into the Product dropdown
function loadProducts() {
    const products = getProducts();

    productSelect.innerHTML = `
        <option value="">Select Product</option>
    `;

    products.forEach(function (product) {
        const option = document.createElement("option");

        option.value = product.id;
        option.textContent = product.name;

        productSelect.appendChild(option);
    });
}


// Add inventory
inventoryForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const products = getProducts();

        const selectedProduct = products.find(
            function (product) {
                return product.id === productSelect.value;
            }
        );

        if (!selectedProduct) {
            alert("Please select a product.");
            return;
        }


        const quantity = Number(quantityInput.value);
        const size = sizeSelect.value;


        if (size === "") {
            alert("Please select a size.");
            return;
        }


        if (quantity <= 0) {
            alert("Quantity must be greater than 0.");
            return;
        }


        const inventory = getInventory();


        const inventoryItem = {

            id: Date.now().toString(),

            productId: selectedProduct.id,

            productName: selectedProduct.name,

            size: size,

            quantity: quantity
        };


        inventory.push(inventoryItem);

        saveInventory(inventory);


        alert("Inventory added successfully.");

        inventoryForm.reset();
    }
);


// Load products when page opens
loadProducts();
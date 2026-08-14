const productForm =
    document.getElementById("productForm");

const productTableBody =
    document.getElementById("productTableBody");

const productName =
    document.getElementById("productName");

const category =
    document.getElementById("category");

const quantity =
    document.getElementById("quantity");

const unit =
    document.getElementById("unit");

const size =
    document.getElementById("size");

const weight =
    document.getElementById("weight");

const fragile =
    document.getElementById("fragile");

const searchInput =
    document.getElementById("searchInput");

const formTitle =
    document.getElementById("formTitle");

const submitBtn =
    document.getElementById("submitBtn");

const cancelBtn =
    document.getElementById("cancelBtn");




const customDimensions =
    document.getElementById("customDimensions");

const lengthInput =
    document.getElementById("length");

const breadthInput =
    document.getElementById("breadth");

const heightInput =
    document.getElementById("height");




const STORAGE_KEY = "products";

const currentUser = JSON.parse(localStorage.getItem("currentuser"));

if (!currentUser) {
    window.location.href = "login.html";
}


let editingProductId = null;


size.addEventListener("change", function () {



    if (size.value === "Custom") {

        customDimensions.style.display = "block";


       

        lengthInput.required = true;
        breadthInput.required = true;
        heightInput.required = true;

    }

    else {


        customDimensions.style.display = "none";



        lengthInput.required = false;
        breadthInput.required = false;
        heightInput.required = false;



        lengthInput.value = "";
        breadthInput.value = "";
        heightInput.value = "";

    }

});




function getProducts() {

    const savedProducts =
        localStorage.getItem(STORAGE_KEY);


    if (savedProducts) {

        return JSON.parse(savedProducts);

    }


    return [];

}


function saveProducts(products) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(products)
    );

}


function displayProducts(products) {

    productTableBody.innerHTML = "";


    // No products

    if (products.length === 0) {

        productTableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-message"
                >
                    No products found.
                </td>
            </tr>
        `;

        return;
    }



    products.forEach(function (product) {

        let dimensions = "-";


        if (product.size === "Custom") {

            dimensions =
                `${product.length} ×
                 ${product.breadth} ×
                 ${product.height} cm`;

        }


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${product.name}
            </td>

            <td>
                ${product.category}
            </td>

            <td>
                ${product.quantity}
            </td>

            <td>
                ${product.unit}
            </td>

            <td>
                ${product.size}
            </td>

            <td>
                ${product.weight} kg
            </td>

            <td>
                ${product.fragile}
            </td>

            <td>
                ${dimensions}
            </td>

            <td>

                <button
                    class="edit-btn"
                    onclick="editProduct('${product.id}')"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteProduct('${product.id}')"
                >
                    Delete
                </button>

            </td>

        `;


        productTableBody.appendChild(row);

    });

}



productForm.addEventListener(
    "submit",
    function (event) {


        event.preventDefault();


        const products =
            getProducts();


        

        const product = {

           
            id:
                editingProductId ||
                Date.now().toString(),


            name:
                productName.value.trim(),


            category:
                category.value,


            quantity:
                Number(quantity.value),


            unit:
                unit.value,


            size:
                size.value,


          

            length:
                size.value === "Custom"
                    ? Number(lengthInput.value)
                    : null,


            breadth:
                size.value === "Custom"
                    ? Number(breadthInput.value)
                    : null,


            height:
                size.value === "Custom"
                    ? Number(heightInput.value)
                    : null,


            weight:
                Number(weight.value),


            fragile:
                fragile.value,

            userEmail: currentUser.email

        };



        if (product.name === "") {

            alert("Please enter the product name.");

            return;

        }


        if (product.category === "") {

            alert("Please select a category.");

            return;

        }


        if (product.quantity <= 0) {

            alert("Quantity must be greater than 0.");

            return;

        }


        if (product.size === "") {

            alert("Please select a product size.");

            return;

        }


        if (product.weight <= 0) {

            alert("Weight must be greater than 0.");

            return;

        }


        if (product.size === "Custom") {

            if (
                product.length <= 0 ||
                product.breadth <= 0 ||
                product.height <= 0
            ) {

                alert(
                    "Please enter valid dimensions."
                );

                return;

            }

        }




        if (editingProductId !== null) {

            const productIndex =
                products.findIndex(
                    function (item) {

                        return (
                           item.id === editingProductId &&
                item.userEmail === currentUser.email
                        );

                    }
                );


            if (productIndex !== -1) {

                products[productIndex] =
                    product;

            }


            alert(
                "Product updated successfully."
            );

        }


        else {

            products.push(product);

            alert(
                "Product added successfully."
            );

        }


    

       saveProducts(products);

       const myProducts = products.filter(function (product) {
    return product.userEmail === currentUser.email;
      });

displayProducts(myProducts);


       

        resetForm();

    }
);




function editProduct(id) {

    const products =
        getProducts();



    const product =
    products.find(function (item) {
        return (
            item.id === id &&
            item.userEmail === currentUser.email
        );
    });

    if (!product) {

        return;

    }



    productName.value =
        product.name;

    category.value =
        product.category;

    quantity.value =
        product.quantity;

    unit.value =
        product.unit;

    size.value =
        product.size;

    weight.value =
        product.weight;

    fragile.value =
        product.fragile;


  

    if (product.size === "Custom") {


        customDimensions.style.display =
            "block";


        lengthInput.required = true;
        breadthInput.required = true;
        heightInput.required = true;



        lengthInput.value =
            product.length;

        breadthInput.value =
            product.breadth;

        heightInput.value =
            product.height;

    }

    else {

  

        customDimensions.style.display =
            "none";

    }



    editingProductId = id;


    
    formTitle.textContent =
        "Edit Product";


  
    submitBtn.textContent =
        "Update Product";




    cancelBtn.style.display =
        "inline-block";



    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}



function deleteProduct(id) {

    const confirmation =
        confirm(
            "Are you sure you want to delete this product?"
        );


    if (!confirmation) {

        return;

    }


    let products =
        getProducts();




 products = products.filter(function (product) {
    return !(
        product.id === id &&
        product.userEmail === currentUser.email
    );
});


   

    saveProducts(products);

    const myProducts = products.filter(function (product) {
        return product.userEmail === currentUser.email;
    });

displayProducts(myProducts);


    alert(
        "Product deleted successfully."
    );


   

    if (editingProductId === id) {

        resetForm();

    }

}




function resetForm() {

    productForm.reset();


   

    editingProductId = null;



    formTitle.textContent =
        "Add Product";



    submitBtn.textContent =
        "Add Product";


   

    cancelBtn.style.display =
        "none";


  
    customDimensions.style.display =
        "none";



    lengthInput.required = false;
    breadthInput.required = false;
    heightInput.required = false;

}



cancelBtn.addEventListener(
    "click",
    function () {

        resetForm();

    }
);




searchInput.addEventListener(
    "input",
    function () {

        const searchText =
            searchInput.value
                .toLowerCase()
                .trim();


        const products =
            getProducts();
        const myProducts = products.filter(function (product) {
            return product.userEmail === currentUser.email;
        });

        const filteredProducts =
            myProducts.filter(
                function (product) {

                    return (

                        product.name
                            .toLowerCase()
                            .includes(searchText)

                        ||

                        product.category
                            .toLowerCase()
                            .includes(searchText)

                        ||

                        product.unit
                            .toLowerCase()
                            .includes(searchText)

                    );

                }
            );


        displayProducts(
            filteredProducts
        );

    }
);



const products = getProducts();

const myProducts = products.filter(function (product) {
    return product.userEmail === currentUser.email;
});

displayProducts(myProducts);
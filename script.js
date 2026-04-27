// Check authentication on page load
(function checkAuth() {
    const isLoggedIn = sessionStorage.getItem("loggedIn") === "true";
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    
    if (!isLoggedIn && currentPage !== 'login.html') {
        window.location.href = "Login.html";
    } else if (isLoggedIn && (currentPage === 'login.html' || currentPage === '')) {
        window.location.href = "AddDetails.html";
    }
})();

// Login Page
function login() {
    const id = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!id || !password) {
        alert("Please enter your Id and Password!");
        return;
    }

    fetch('http://127.0.0.1:5000/login/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
    })
        .then(res => {
            if (res.status === 401) {
                throw new Error("Your Id and Password is wrong");
            }

            if (res.ok) {
                sessionStorage.setItem("loggedIn", "true");
                sessionStorage.setItem("adminId", id);

                window.location.href = "AddDetails.html";
            } else {
                throw new Error("Login Failed");
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert(err.message);
        });
}

// ADD CUSTOMER
function addCustomer() {
    const id = document.getElementById("cid").value.trim();
    const name = document.getElementById("cname").value.trim();
    const mobile = document.getElementById("cmobile").value.trim();
    const address = document.getElementById("caddress").value.trim();
    const file = document.getElementById("cphoto").files[0];

    if (!id || !name || !mobile || !address || !file) {
        alert("Fill all fields + select photo");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(uploadData => {

            const photoPath = uploadData.path;

            return fetch('http://127.0.0.1:5000/add_customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: parseInt(id),
                    name: name,
                    mobile: mobile,
                    address: address,
                    photo: photoPath
                })
            });
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message || "Customer Added Successfully");
            window.location.href = "loadcustomers.html";
        })
        .catch(err => {
            console.error(err);
            alert("Error: " + err.message);
        });
}

// upload Photo
let uploadedPath = "";

function uploadPhoto() {
    const fileInput = document.getElementById("cphoto");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a photo");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            uploadedPath = data.path;
            alert("Uploaded!");
        });
}

// DELETE CUSTOMER
function deleteCustomer() {
    const id = document.getElementById("deleteId").value;

    if (!id) {
        alert("Please enter Customer ID");
        return;
    }

    fetch(`http://127.0.0.1:5000/delete_customers/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(`Customer with ID ${id} deleted successfully`);
                document.getElementById("deleteId").value = "";
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Failed to delete customer");
        });
}

// LOAD CUSTOMERS
function loadCustomers() {

    fetch('http://127.0.0.1:5000/customers')
        .then(res => res.json())
        .then(data => {

            let grid = document.getElementById("grid");
            grid.innerHTML = "";

            data.forEach(c => {

                let imgPath = `http://127.0.0.1:5000/${c.photo}`;

                let card = `
                <div class="card">
                    <div class="card-img">
                        <img src="${imgPath}" alt="${c.name}" width="200">
                    </div>

                    <div class="card-body">
                        <div class="card-name">${c.name}</div>
                        <a class="card-link" href="Viewdetails.html?id=${c.id}">
                            View details
                        </a>
                    </div>
                </div>
            `;

                grid.innerHTML += card;
            });

        })
        .catch(err => {
            console.error("Error loading customers:", err);
        });
}


// VIEW FULL DETAILS
if (window.location.pathname.includes("Viewdetails.html")) {

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
        fetch(`http://127.0.0.1:5000/customer/${id}`)
            .then(res => res.json())
            .then(data => {

                let imgPath = `http://127.0.0.1:5000/${data.photo}`;

                document.getElementById("details").innerHTML = `
                <img src="${imgPath}" width="200"><br><br>
                <b>Name:</b> ${data.name}<br>
                <b>Mobile:</b> ${data.mobile}<br>
                <b>Address:</b> ${data.address}
            `;
            });
    }
}
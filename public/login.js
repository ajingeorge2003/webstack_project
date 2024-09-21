document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const responseText = await response.text();

        // Check for error status and show alert
        if (response.status === 400) {
            alert(responseText); // Shows "Invalid credentials" message
        } else if (response.status === 200) {
            alert(responseText); // Shows "Login successful"
            window.location.href = '/books.html'; // Redirect to books.html on success
        }
    } catch (error) {
        alert("An error occurred: " + error.message); // Show network or other errors
    }
});

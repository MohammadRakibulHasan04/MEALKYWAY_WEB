// Order Page JavaScript
const API_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    const contactNumberInput = document.getElementById('contactNumber');
    const nameInput = document.getElementById('name');
    const hallInput = document.getElementById('hall');
    const roomInput = document.getElementById('room');
    const quantityInput = document.getElementById('quantity');
    const dateInput = document.getElementById('date');
    const totalPriceElement = document.getElementById('totalPrice');
    const formMessage = document.getElementById('formMessage');

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;

    // Update total price when quantity changes
    quantityInput.addEventListener('input', () => {
        const quantity = parseInt(quantityInput.value) || 0;
        const total = quantity * 30;
        totalPriceElement.textContent = total;
    });

    // Auto-fill customer data when contact number is entered
    contactNumberInput.addEventListener('blur', async () => {
        const contactNumber = contactNumberInput.value.trim();
        
        if (contactNumber.length === 11 && contactNumber.startsWith('01')) {
            try {
                const response = await fetch(`${API_URL}/api/customer/${contactNumber}`);
                const data = await response.json();

                if (data.exists && data.customer) {
                    // Auto-fill the form
                    nameInput.value = data.customer.name;
                    hallInput.value = data.customer.hall;
                    roomInput.value = data.customer.room;
                    
                    showMessage('Welcome back! Your information has been auto-filled.', 'success');
                    
                    // Make fields readonly for returning customers
                    nameInput.setAttribute('readonly', true);
                    hallInput.setAttribute('disabled', true);
                    roomInput.setAttribute('readonly', true);
                } else {
                    // New customer - make sure fields are editable
                    nameInput.removeAttribute('readonly');
                    hallInput.removeAttribute('disabled');
                    roomInput.removeAttribute('readonly');
                    
                    // Clear the form
                    nameInput.value = '';
                    hallInput.value = '';
                    roomInput.value = '';
                }
            } catch (error) {
                console.error('Error fetching customer:', error);
            }
        }
    });

    // Handle form submission
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = {
            contactNumber: contactNumberInput.value.trim(),
            name: nameInput.value.trim(),
            hall: hallInput.value,
            room: roomInput.value.trim(),
            quantity: parseInt(quantityInput.value),
            date: dateInput.value
        };

        // Validate phone number
        if (!formData.contactNumber.match(/^01[0-9]{9}$/)) {
            showMessage('Please enter a valid 11-digit phone number starting with 01', 'error');
            return;
        }

        // Disable submit button
        const submitBtn = orderForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Processing...</span>';

        try {
            const response = await fetch(`${API_URL}/api/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Redirect to confirmation page
                window.location.href = `/confirmation?orderId=${data.orderId}`;
            } else {
                showMessage(data.error || 'Failed to place order. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Error placing order:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // Show message helper
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }
    }
});

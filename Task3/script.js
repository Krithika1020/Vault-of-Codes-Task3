document.getElementById('password').addEventListener('input', function() {
    var password = this.value;
    var strengthBadge = document.getElementById('password-strength');

    // Default strength
    var strength = 'Weak';
    var textColor = 'red';

    if (password.length > 8) {
        strength = 'Strong';
        textColor = 'green';
    } else if (password.length >= 6) {
        strength = 'Medium';
        textColor = 'orange';
    }

    strengthBadge.textContent = 'Strength: ' + strength;
    strengthBadge.style.color = textColor;

    // Update password input data attribute for styling
    this.setAttribute('data-strength', strength.toLowerCase());
});


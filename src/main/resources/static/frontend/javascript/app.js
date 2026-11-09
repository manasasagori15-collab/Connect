
// CLIMENTOS LOGIN AND REGISTRATION

const $ = (id) => document.getElementById(id);


// PAGE VIEWS

const views = {
    login: $("loginView"),
    register: $("registerView"),
    forgot: $("forgotView")
};


function clearMessages() {

    [
        "errorMessage",
        "registerError",
        "registerSuccess",
        "forgotMessage"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent = "";
            element.className =
                id === "registerSuccess" ? "success-message form-message" :
                id === "errorMessage" ? "error-message" :
                id === "registerError" ? "error-message form-message" :
                "form-message";
        }

    });

}


function showView(viewName) {

    Object.values(views).forEach(view => {
        view.classList.remove("active-view");
    });

    views[viewName].classList.add("active-view");

    clearMessages();

}


// NAVIGATION

$("showRegister").addEventListener("click", function(event) {

    event.preventDefault();

    showView("register");

});


$("showLogin").addEventListener("click", function(event) {

    event.preventDefault();

    showView("login");

});


$("showForgot").addEventListener("click", function(event) {

    event.preventDefault();

    showView("forgot");

});


$("backToLogin").addEventListener("click", function(event) {

    event.preventDefault();

    showView("login");

});


// PASSWORD VISIBILITY


function setupPasswordToggle(inputId, buttonId) {

    const input = $(inputId);
    const button = $(buttonId);
    const icon = button.querySelector("img");

    button.addEventListener("click", function() {

        const showPassword = input.type === "password";

        input.type = showPassword ? "text" : "password";

        icon.src = showPassword
            ? "https://cdn-icons-png.flaticon.com/512/2767/2767146.png"
            : "https://cdn-icons-png.flaticon.com/512/159/159604.png";

        button.setAttribute(
            "aria-label",
            showPassword ? "Hide password" : "Show password"
        );

    });

}


setupPasswordToggle("password", "togglePassword");

setupPasswordToggle("registerPassword", "toggleRegisterPassword");

setupPasswordToggle("confirmPassword", "toggleConfirmPassword");



// PASSWORD STRENGTH INDICATOR

const registerPasswordField = $("registerPassword");


const passwordRules = [

    {
        id: "reqLength",
        test: value => value.length >= 8
    },

    {
        id: "reqLower",
        test: value => /[a-z]/.test(value)
    },

    {
        id: "reqUpper",
        test: value => /[A-Z]/.test(value)
    },

    {
        id: "reqNumber",
        test: value => /[0-9]/.test(value)
    },

    {
        id: "reqSpecial",
        test: value => /[^A-Za-z0-9]/.test(value)
    }

];


registerPasswordField.addEventListener("input", function() {

    const password = registerPasswordField.value;

    let strength = 0;

    passwordRules.forEach(rule => {

        const element = $(rule.id);

        const valid = rule.test(password);

        if (valid) {
            strength++;
        }

        element.classList.toggle("valid", valid);

        const label = element.textContent.substring(2);

        element.textContent = (valid ? "✓ " : "✗ ") + label;

    });


    const strengthFill = $("strengthFill");

    const strengthText = $("strengthText");


    if (password.length === 0) {

        strengthFill.style.width = "0";

        strengthFill.style.background = "transparent";

        strengthText.textContent = "Password strength";

    } else if (strength <= 2) {

        strengthFill.style.width = "33%";

        strengthFill.style.background = "#ef4444";

        strengthText.textContent = "Weak password";

    } else if (strength <= 4) {

        strengthFill.style.width = "66%";

        strengthFill.style.background = "#f59e0b";

        strengthText.textContent = "Medium password";

    } else {

        strengthFill.style.width = "100%";

        strengthFill.style.background = "#22c55e";

        strengthText.textContent = "Strong password";

    }

});



// LOGIN FORM - BACKEND INTEGRATION

$("loginForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    $("errorMessage").textContent = "";

    const email = $("email").value.trim();

    const password = $("password").value;


    if (!email || !password) {

        $("errorMessage").textContent =
            "Please enter your email and password.";

        return;

    }


    try {

        const response = await fetch("/api/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })

        });


        const result = await response.json().catch(() => ({}));


        if (response.ok) {

            window.location.href =
                "welcome.html?user=" + encodeURIComponent(email);

        } else {

            $("errorMessage").textContent =
                result.message || "Invalid email or password.";

        }


    } catch (error) {

        console.error("Login error:", error);

        $("errorMessage").textContent =
            "Unable to connect to the server. Please try again.";

    }

});



// REGISTRATION FORM

$("registerForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    $("registerError").textContent = "";

    $("registerSuccess").textContent = "";


    const firstName = $("firstName").value.trim();

    const surname = $("surname").value.trim();

    const email = $("registerEmail").value.trim();

    const mobile = $("mobile").value.trim();

    const dob = $("dateOfBirth").value;

    const gender = $("gender").value;

    const password = $("registerPassword").value;

    const confirm = $("confirmPassword").value;


    function showError(message) {

        $("registerError").textContent = message;

    }


    // EMPTY FIELD VALIDATION

    if (
        !firstName ||
        !surname ||
        !email ||
        !mobile ||
        !dob ||
        !gender ||
        !password ||
        !confirm
    ) {

        showError("Please fill in all required fields.");

        return;

    }


    // NAME VALIDATION

    const namePattern = /^[A-Za-z][A-Za-z\s'-]*$/;

    if (
        !namePattern.test(firstName) ||
        !namePattern.test(surname)
    ) {

        showError("Please enter a valid first name and surname.");

        return;

    }


    // EMAIL VALIDATION

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        showError("Please enter a valid email address.");

        return;

    }


    // MOBILE VALIDATION

    const mobilePattern = /^\+?[0-9\s()-]{7,20}$/;

    const digitCount = mobile.replace(/\D/g, "").length;

    if (
        !mobilePattern.test(mobile) ||
        digitCount < 7 ||
        digitCount > 15
    ) {

        showError("Please enter a valid mobile number.");

        return;

    }


    // DATE OF BIRTH VALIDATION

    const birthDate = new Date(dob + "T00:00:00");

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (
        Number.isNaN(birthDate.getTime()) ||
        birthDate >= today
    ) {

        showError("Date of birth must be in the past.");

        return;

    }


    // PASSWORD VALIDATION

    const strongPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!strongPassword.test(password)) {

        showError(
            "Password needs 8+ characters, uppercase, lowercase, number and special character."
        );

        return;

    }


    // CONFIRM PASSWORD

    if (password !== confirm) {

        showError("Passwords do not match.");

        return;

    }


    // CONNECT TO SPRING BOOT REGISTRATION API

    try {

        const response = await fetch("/api/auth/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                firstName: firstName,

                surname: surname,

                email: email,

                mobile: mobile,

                dateOfBirth: dob,

                gender: gender,

                password: password

            })

        });


        const result = await response.json().catch(() => ({}));


        if (response.ok) {

            $("registerSuccess").textContent =
                result.message || "Registration successful!";

            $("registerForm").reset();


            $("strengthFill").style.width = "0";

            $("strengthFill").style.background = "transparent";

            $("strengthText").textContent = "Password strength";


            passwordRules.forEach(rule => {

                const element = $(rule.id);

                element.classList.remove("valid");

                element.textContent =
                    "✗ " + element.textContent.substring(2);

            });


        } else {

            $("registerError").textContent =
                result.message || "Registration failed. Please try again.";

        }


    } catch (error) {

        console.error("Registration error:", error);

        $("registerError").textContent =
            "Unable to connect to the server. Please try again.";

    }

});



// FORGOT PASSWORD - EMAIL RESET LINK

$("forgotForm").addEventListener("submit", async function(event) {

    event.preventDefault();


    const email = $("recoveryContact").value.trim();

    const message = $("forgotMessage");

    const submitButton = $("forgotForm").querySelector(
        'button[type="submit"]'
    );


    message.textContent = "";

    message.className = "form-message";


    // EMAIL REQUIRED VALIDATION

    if (!email) {

        message.classList.add("error-message");

        message.textContent = "Please enter your email address.";

        return;

    }


    // EMAIL FORMAT VALIDATION

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        message.classList.add("error-message");

        message.textContent = "Please enter a valid email address.";

        return;

    }


    // DISABLE BUTTON WHILE REQUEST IS PROCESSING

    submitButton.disabled = true;

    submitButton.textContent = "Sending...";


    try {

        // SEND EMAIL TO SPRING BOOT BACKEND

        const response = await fetch("/api/auth/forgot-password", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email
            })

        });


        const result = await response.json().catch(() => ({}));


        if (response.ok) {

            message.classList.add("success-message");

            message.textContent =
                result.message ||
                "If an account exists for this email, a password reset link will be sent.";

        } else {

            message.classList.add("error-message");

            message.textContent =
                result.message || "Unable to process your request.";

        }


    } catch (error) {

        console.error("Password reset error:", error);

        message.classList.add("error-message");

        message.textContent =
            "Unable to connect to the server. Please try again.";

    } finally {

        submitButton.disabled = false;

        submitButton.textContent = "Send Reset Link";

    }

});



// SOCIAL LOGIN PLACEHOLDERS

$("facebookButton").addEventListener("click", function() {

    alert("Facebook login requires OAuth and backend integration.");

});


$("googleButton").addEventListener("click", function() {

    alert("Google login requires OAuth and backend integration.");

});

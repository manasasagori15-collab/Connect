
const resetForm = document.getElementById("resetPasswordForm");

const resetMessage = document.getElementById("resetMessage");

const resetSubmit = document.getElementById("resetSubmit");


// SHOW / HIDE PASSWORD
document.querySelectorAll(".eye-button").forEach(button => {

    button.addEventListener("click", () => {

        const input = document.getElementById(
            button.dataset.target
        );

        const isPasswordHidden = input.type === "password";

        if (isPasswordHidden) {

            input.type = "text";

            button.textContent = "Hide";

            button.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            input.type = "password";

            button.textContent = "Show";

            button.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    });

});


// RESET PASSWORD FORM
resetForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    resetMessage.textContent = "";

    resetMessage.className = "reset-message";


    // GET PASSWORD VALUES
    const newPassword = document.getElementById(
        "newPassword"
    ).value;

    const confirmPassword = document.getElementById(
        "confirmPassword"
    ).value;


    // CHECK PASSWORD MATCH
    if (newPassword !== confirmPassword) {

        resetMessage.textContent =
            "Passwords do not match.";

        resetMessage.classList.add("error");

        return;
    }


    // CHECK PASSWORD LENGTH
    if (newPassword.length < 8) {

        resetMessage.textContent =
            "Password must contain at least 8 characters.";

        resetMessage.classList.add("error");

        return;
    }


    // GET TOKEN FROM URL
    const urlParams = new URLSearchParams(
        window.location.search
    );

    const token = urlParams.get("token");


    if (!token) {

        resetMessage.textContent =
            "Invalid reset link. Please request a new password reset email.";

        resetMessage.classList.add("error");

        return;
    }


    // DISABLE BUTTON WHILE PROCESSING
    resetSubmit.disabled = true;

    resetSubmit.textContent = "Updating password...";


    try {

        // SEND REQUEST TO SPRING BOOT
        const response = await fetch(
            "/api/auth/reset-password",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    token: token,

                    newPassword: newPassword

                })

            }
        );


        // READ SERVER RESPONSE
        const data = await response.json().catch(() => ({}));


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Unable to reset password. Please try again."
            );

        }


        // SUCCESS MESSAGE
        resetMessage.textContent =
            data.message ||
            "Your password has been reset successfully. You can now log in.";

        resetMessage.classList.add("success");


        // CLEAR FORM
        resetForm.reset();


        // HIDE PASSWORDS AGAIN
        document.querySelectorAll(".eye-button").forEach(button => {

            button.textContent = "Show";

            button.setAttribute(
                "aria-label",
                "Show password"
            );

        });

        document.querySelectorAll(
            "#newPassword, #confirmPassword"
        ).forEach(input => {

            input.type = "password";

        });


        // CHANGE BUTTON TEXT
        resetSubmit.textContent = "Password updated";


    } catch (error) {

        // ERROR MESSAGE
        resetMessage.textContent = error.message;

        resetMessage.classList.add("error");

        resetSubmit.disabled = false;

        resetSubmit.textContent = "Reset password";

    }

});

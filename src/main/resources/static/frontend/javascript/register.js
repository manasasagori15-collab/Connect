const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const dateOfBirthInput = document.getElementById("dateOfBirth");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("registerPassword");

const confirmPasswordInput = document.getElementById("confirmPassword");
const registerButton = document.getElementById("registerButton");
const genderInputs = document.getElementsByName("gender");
const errorMessage = document.getElementById("errorMessage");

const successMessage = document.getElementById("successMessage");

function getSelectedGender() {

    for (let gender of genderInputs) {
        if (gender.checked) {
            return gender.value;
        }
    }
    return "";
}
registerButton.addEventListener("click", function() {
    errorMessage.textContent = "";
    successMessage.textContent = "";
    if (firstNameInput.value.trim() === "") {
        errorMessage.textContent = "Please enter your first name";
        return;
    }
    if (lastNameInput.value.trim() === "") {
        errorMessage.textContent = "Please enter your surname";
        return;
    }
    if (dateOfBirthInput.value === "") {
    errorMessage.textContent = "Please select your date of birth";
    return;
    }

});

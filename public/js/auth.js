const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("registerMessage");

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            const data = await response.json();

            message.textContent = data.message;

            if (data.success) {
                localStorage.setItem(
                    "botHubUser",
                    JSON.stringify(data.user)
                );

                setTimeout(() => {
                    window.location.href = "/";
                }, 700);
            }

        } catch (error) {
            message.textContent = "Erro ao conectar ao servidor.";
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        const message = document.getElementById("loginMessage");

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            message.textContent = data.message;

            if (data.success) {
                localStorage.setItem(
                    "botHubUser",
                    JSON.stringify(data.user)
                );

                setTimeout(() => {
                    window.location.href = "/";
                }, 700);
            }

        } catch (error) {
            message.textContent = "Erro ao conectar ao servidor.";
        }
    });
}

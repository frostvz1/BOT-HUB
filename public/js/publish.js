const form = document.getElementById("publishBotForm");
const message = document.getElementById("publishMessage");

const savedUser = localStorage.getItem("botHubUser");

if (!savedUser) {
    window.location.href = "/login.html";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = JSON.parse(savedUser);

    const botName =
        document.getElementById("botName").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const category =
        document.getElementById("category").value;

    const platform =
        document.getElementById("platform").value;

    const link =
        document.getElementById("link").value.trim();

    const tags =
        document.getElementById("tags").value.trim();

    const imageInput =
        document.getElementById("botImage");

    const image =
        imageInput.files[0];

    if (image && image.size > 5 * 1024 * 1024) {
        message.textContent =
            "A imagem deve ter no máximo 5 MB.";

        return;
    }

    const formData = new FormData();

    formData.append("userId", user.id);
    formData.append("botName", botName);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("platform", platform);
    formData.append("link", link);
    formData.append("tags", tags);

    if (image) {
        formData.append("image", image);
    }

    try {
        message.textContent =
            "Publicando bot...";

        const response = await fetch(
            "/api/bots",
            {
                method: "POST",
                body: formData
            }
        );

        const data =
            await response.json();

        message.textContent =
            data.message;

        if (data.success) {

            form.reset();

            setTimeout(() => {
                window.location.href = "/";
            }, 1000);
        }

    } catch (error) {

        console.error(error);

        message.textContent =
            "Erro ao conectar com o servidor.";
    }
});

const container =
    document.getElementById("profileContainer");

const savedUser =
    localStorage.getItem("botHubUser");

if (!savedUser) {
    window.location.href = "/login.html";
}

const usuario = JSON.parse(savedUser);

async function carregarPerfil() {

    try {

        const response = await fetch(
            `/api/users/${encodeURIComponent(usuario.id)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Erro ao carregar perfil."
            );
        }

        mostrarPerfil(data);

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty">
                <div class="empty-icon"></div>
                <h3>Erro ao carregar perfil</h3>
                <p>${escaparHTML(error.message)}</p>
            </div>
        `;
    }
}

function mostrarPerfil(data) {

    const user = data.user;
    const stats = data.stats;
    const bots = data.bots || [];

    const dataCadastro =
        new Date(user.createdAt).toLocaleDateString(
            "pt-BR"
        );

    container.innerHTML = `

        <section class="profile-card">

            <div class="profile-avatar">

                ${
                    user.avatar
                        ? `
                            <img
                                src="${escaparAtributo(user.avatar)}"
                                alt="Foto de ${escaparAtributo(user.username)}"
                            >
                        `
                        : `
                            ${escaparHTML(
                                user.username
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        `
                }

            </div>

            <label class="change-avatar">
                Alterar foto

                <input
                    id="avatarInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onchange="alterarAvatar(event)"
                >
            </label>

            <h2>
                ${escaparHTML(user.username)}
            </h2>

            <p>
                ${escaparHTML(user.email)}
            </p>

            <small>
                Membro desde ${dataCadastro}
            </small>

            <div class="profile-stats">

                <div>
                    <strong>${stats.bots}</strong>
                    <span>Bots</span>
                </div>

                <div>
                    <strong>${stats.views}</strong>
                    <span>Visualizações</span>
                </div>

            </div>

        </section>

        <section class="my-bots">

            <div class="section-title">
                <h2>Meus bots</h2>
            </div>

            <div id="myBots">

                ${
                    bots.length
                        ? bots.map(criarBot).join("")
                        : `
                            <div class="empty">
                                <div class="empty-icon">
                                    
                                </div>

                                <h3>
                                    Você ainda não publicou bots
                                </h3>

                                <p>
                                    Publique seu primeiro bot
                                    no BOT HUB.
                                </p>
                            </div>
                        `
                }

            </div>

        </section>
    `;
}

function criarBot(bot) {

    return `
        <article class="mini-bot-card">

            <div class="mini-bot-icon">
                
            </div>

            <div class="mini-bot-info">

                <h3>
                    ${escaparHTML(bot.botName)}
                </h3>

                <p>
                    ${escaparHTML(bot.category)}
                    •
                    ${escaparHTML(bot.platform)}
                </p>

                <small>
                     ${bot.views || 0} visualizações
                </small>

            </div>

            <button
                onclick="abrirBot('${bot.id}')"
            >
                →
            </button>

        </article>
    `;
}

function abrirBot(id) {

    window.location.href =
        `/bot.html?id=${encodeURIComponent(id)}`;
}

function publicarBot() {

    window.location.href =
        "/publicar.html";
}

function sair() {

    localStorage.removeItem("botHubUser");

    window.location.href =
        "/login.html";
}

function escaparAtributo(texto) {

    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

async function alterarAvatar(event) {

    const arquivo =
        event.target.files[0];

    if (!arquivo) {
        return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {

        alert(
            "A imagem deve ter no máximo 5 MB."
        );

        event.target.value = "";
        return;
    }

    const dados = new FormData();

    dados.append(
        "avatar",
        arquivo
    );

    try {

        const response = await fetch(
            `/api/users/${encodeURIComponent(usuario.id)}/avatar`,
            {
                method: "POST",
                body: dados
            }
        );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Não foi possível atualizar a foto."
            );
        }

        const usuarioAtualizado = {
            ...usuario,
            avatar: data.avatar
        };

        localStorage.setItem(
            "botHubUser",
            JSON.stringify(usuarioAtualizado)
        );

        carregarPerfil();

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        String(texto ?? "");

    return div.innerHTML;
}

carregarPerfil();

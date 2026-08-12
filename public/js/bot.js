const botPage = document.getElementById("botPage");

const parametros = new URLSearchParams(
    window.location.search
);

const botId = parametros.get("id");

let botAtual = null;

const savedUser =
    localStorage.getItem("botHubUser");

const usuario =
    savedUser ? JSON.parse(savedUser) : null;

async function carregarBot() {

    if (!botId) {
        mostrarErro("Nenhum bot foi especificado.");
        return;
    }

    try {

        const resposta = await fetch(
            `/api/bots/${encodeURIComponent(botId)}`
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.success) {
            throw new Error(
                dados.message || "Bot não encontrado."
            );
        }

        botAtual = dados.bot;

        const avaliacao =
            await carregarAvaliacao();

        mostrarBot(
            botAtual,
            avaliacao
        );

        registrarVisualizacao(botAtual.id);

    } catch (erro) {

        console.error(erro);

        mostrarErro(
            erro.message ||
            "Não foi possível carregar o bot."
        );
    }
}

async function carregarAvaliacao() {

    try {

        const resposta = await fetch(
            `/api/bots/${encodeURIComponent(botId)}/ratings`
        );

        const dados = await resposta.json();

        if (dados.success) {
            return dados;
        }

    } catch (erro) {
        console.error(erro);
    }

    return {
        average: 0,
        total: 0
    };
}

function mostrarBot(bot, avaliacao) {

    const souDono =
        usuario &&
        bot.creator &&
        usuario.id === bot.creator.id;

    const tags = (bot.tags || [])
        .map(tag => `
            <span>#${escaparHTML(tag)}</span>
        `)
        .join("");

    botPage.innerHTML = `

        <section class="bot-profile">

            <div class="large-bot-icon">
                
            </div>

            <h2>
                ${escaparHTML(bot.botName)}
            </h2>

            <p class="bot-creator">
                Publicado por
                <strong>
                    ${escaparHTML(bot.creator.username)}
                </strong>
            </p>

            <div class="bot-stats">

                <div>
                    <strong id="views">
                        ${bot.views || 0}
                    </strong>
                    <span>Visualizações</span>
                </div>

                <div>
                    <strong id="ratingValue">
                        ${avaliacao.average || "—"}
                    </strong>
                    <span>
                         ${avaliacao.total} avaliações
                    </span>
                </div>

            </div>

        </section>

        <section class="bot-details">

            <div class="detail-item">
                <span>Categoria</span>
                <strong>
                    ${escaparHTML(bot.category)}
                </strong>
            </div>

            <div class="detail-item">
                <span>Plataforma</span>
                <strong>
                    ${escaparHTML(bot.platform)}
                </strong>
            </div>

            <div class="description">

                <h3>Sobre o bot</h3>

                <p>
                    ${escaparHTML(bot.description)}
                </p>

            </div>

            ${
                tags
                    ? `
                    <div class="bot-tags page-tags">
                        ${tags}
                    </div>
                    `
                    : ""
            }

            <div class="rating-box">

                <h3>Avalie este bot</h3>

                <div class="stars">

                    <button onclick="avaliar(1)"></button>
                    <button onclick="avaliar(2)"></button>
                    <button onclick="avaliar(3)"></button>
                    <button onclick="avaliar(4)"></button>
                    <button onclick="avaliar(5)"></button>

                </div>

                <p id="ratingMessage">
                    Escolha uma nota de 1 a 5.
                </p>

            </div>

            <button
                class="favorite-button"
                onclick="alternarFavorito()"
            >
                 Adicionar aos favoritos
            </button>

            <a
                class="access-button"
                href="${escaparAtributo(bot.link)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                 Acessar bot
            </a>

            <button
                class="secondary-button"
                onclick="compartilharBot()"
            >
                 Compartilhar
            </button>

            ${
                souDono
                    ? `
                        <button
                            class="delete-bot-button"
                            onclick="excluirBot()"
                        >
                            Excluir bot
                        </button>
                    `
                    : ""
            }

        </section>
    `;
}

async function avaliar(nota) {

    if (!usuario) {

        window.location.href =
            "/login.html";

        return;
    }

    try {

        const resposta = await fetch(
            `/api/bots/${encodeURIComponent(botId)}/rate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: usuario.id,
                    rating: nota
                })
            }
        );

        const dados = await resposta.json();

        const message =
            document.getElementById("ratingMessage");

        if (!resposta.ok || !dados.success) {
            message.textContent =
                dados.message ||
                "Não foi possível salvar.";
            return;
        }

        message.textContent =
            `Você avaliou com ${nota} estrela${nota > 1 ? "s" : ""}.`;

        const rating =
            document.getElementById("ratingValue");

        if (rating) {
            rating.textContent = dados.rating;
        }

    } catch (erro) {

        console.error(erro);

        document.getElementById(
            "ratingMessage"
        ).textContent =
            "Erro ao salvar avaliação.";
    }
}

async function alternarFavorito() {

    if (!usuario) {

        window.location.href =
            "/login.html";

        return;
    }

    try {

        const resposta = await fetch(
            `/api/users/${encodeURIComponent(usuario.id)}/favorites/${encodeURIComponent(botId)}`,
            {
                method: "POST"
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.success) {
            alert(
                dados.message ||
                "Não foi possível atualizar favoritos."
            );
            return;
        }

        const botao =
            document.querySelector(".favorite-button");

        if (dados.favoritado) {

            botao.textContent =
                " Remover dos favoritos";

        } else {

            botao.textContent =
                " Adicionar aos favoritos";
        }

    } catch (erro) {

        console.error(erro);

        alert(
            "Erro ao atualizar favoritos."
        );
    }
}

async function registrarVisualizacao(id) {

    try {

        const resposta = await fetch(
            `/api/bots/${encodeURIComponent(id)}/view`,
            {
                method: "POST"
            }
        );

        const dados = await resposta.json();

        if (dados.success) {

            const views =
                document.getElementById("views");

            if (views) {
                views.textContent =
                    dados.views;
            }
        }

    } catch (erro) {

        console.error(
            "Erro ao registrar visualização:",
            erro
        );
    }
}

async function compartilharBot() {

    const url =
        window.location.href;

    try {

        if (navigator.share) {

            await navigator.share({
                title: botAtual
                    ? botAtual.botName
                    : "BOT HUB",
                text: "Confira este bot no BOT HUB.",
                url
            });

            return;
        }

        await navigator.clipboard.writeText(url);

        alert("Link copiado!");

    } catch (erro) {

        console.error(erro);
    }
}

function publicarBot() {

    if (!localStorage.getItem("botHubUser")) {
        window.location.href = "/login.html";
        return;
    }

    window.location.href =
        "/publicar.html";
}

function perfil() {

    if (!localStorage.getItem("botHubUser")) {
        window.location.href = "/login.html";
        return;
    }

    window.location.href =
        "/perfil.html";
}

function mostrarErro(mensagem) {

    botPage.innerHTML = `
        <div class="empty">
            <div class="empty-icon"></div>
            <h3>Erro</h3>
            <p>${escaparHTML(mensagem)}</p>
        </div>
    `;
}

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        String(texto ?? "");

    return div.innerHTML;
}

function escaparAtributo(texto) {

    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

carregarBot();


async function excluirBot() {

    if (!usuario) {
        window.location.href = "/login.html";
        return;
    }

    if (!botAtual) {
        return;
    }

    const confirmar = confirm(
        "Tem certeza que deseja excluir este bot?\n\nEssa ação não pode ser desfeita."
    );

    if (!confirmar) {
        return;
    }

    try {

        const resposta = await fetch(
            `/api/bots/${encodeURIComponent(botAtual.id)}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: usuario.id
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.success) {

            alert(
                dados.message ||
                "Não foi possível excluir o bot."
            );

            return;
        }

        alert("Bot excluído com sucesso.");

        window.location.href = "/";

    } catch (erro) {

        console.error(erro);

        alert(
            "Erro ao conectar com o servidor."
        );
    }
}

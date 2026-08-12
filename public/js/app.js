let todosOsBots = [];
let categoriaAtual = "Todos";

const botsContainer = document.getElementById("botsContainer");
const searchInput = document.getElementById("searchInput");

async function carregarBots() {

    botsContainer.innerHTML = `
        <div class="loading">
            Carregando bots...
        </div>
    `;

    try {

        const resposta = await fetch("/api/bots");
        const dados = await resposta.json();

        if (!dados.success) {
            throw new Error("Erro na API");
        }

        todosOsBots = dados.bots || [];

        mostrarBots();

    } catch (erro) {

        console.error(erro);

        botsContainer.innerHTML = `
            <div class="empty">
                <h3>Não foi possível carregar os bots.</h3>
                <p>Verifique se o servidor está funcionando.</p>
            </div>
        `;
    }
}

function mostrarBots() {

    const pesquisa = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const filtrados = todosOsBots.filter(bot => {

        const correspondeCategoria =
            categoriaAtual === "Todos" ||
            bot.category === categoriaAtual;

        const textoBot = `
            ${bot.botName}
            ${bot.description}
            ${bot.category}
            ${bot.platform}
            ${(bot.tags || []).join(" ")}
        `.toLowerCase();

        const correspondePesquisa =
            !pesquisa ||
            textoBot.includes(pesquisa);

        return correspondeCategoria && correspondePesquisa;
    });

    if (filtrados.length === 0) {

        botsContainer.innerHTML = `
            <div class="empty">
                <div class="empty-icon"></div>
                <h3>Nenhum bot encontrado</h3>
                <p>
                    Tente outra pesquisa ou categoria.
                </p>
            </div>
        `;

        return;
    }

    botsContainer.innerHTML = filtrados
        .map(criarCardBot)
        .join("");
}

function criarCardBot(bot) {

    const tags = (bot.tags || [])
        .slice(0, 4)
        .map(tag => `<span>#${escaparHTML(tag)}</span>`)
        .join("");

    return `
        <article class="bot-card">

            <div class="bot-icon">
                <img
                    src="${escaparAtributo(bot.image || "/assets/bot-default.jpg")}"
                    alt="${escaparAtributo(bot.botName)}"
                    onerror="this.src='/assets/bot-default.jpg'"
                >
                
            </div>

            <div class="bot-info">

                <h3>
                    ${escaparHTML(bot.botName)}
                </h3>

                <p>
                    ${escaparHTML(bot.description)}
                </p>

                <div class="bot-meta">
                    <span>
                        ${escaparHTML(bot.category)}
                    </span>

                    <span>
                        ${escaparHTML(bot.platform)}
                    </span>

                    <span>
                         ${bot.views || 0}
                    </span>
                </div>

                <div class="bot-tags">
                    ${tags}
                </div>

            </div>

            <button
                class="view-button"
                onclick="abrirBot('${bot.id}')"
            >
                Ver bot
            </button>

        </article>
    `;
}

function escaparAtributo(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = String(texto ?? "");

    return div.innerHTML;
}

function abrirBot(id) {

    window.location.href =
        `/bot.html?id=${encodeURIComponent(id)}`;
}

function focusSearch() {

    if (!searchInput) return;

    searchInput.focus();

    searchInput.scrollIntoView({
        behavior: "smooth"
    });
}

function publicarBot() {

    const usuario =
        localStorage.getItem("botHubUser");

    if (!usuario) {
        window.location.href = "/login.html";
        return;
    }

    window.location.href = "/publicar.html";
}

function irParaPerfil() {

    const usuario =
        localStorage.getItem("botHubUser");

    if (!usuario) {
        window.location.href = "/login.html";
        return;
    }

    window.location.href = "/perfil.html";
}

if (searchInput) {

    searchInput.addEventListener(
        "input",
        mostrarBots
    );
}

document
    .querySelectorAll("[data-category]")
    .forEach(botao => {

        botao.addEventListener("click", () => {

            categoriaAtual =
                botao.dataset.category;

            mostrarBots();
        });

    });

carregarBots();

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const PORT = 3001;

const botUploadDir = path.join(
    __dirname,
    "public",
    "uploads",
    "bots"
);

if (!fs.existsSync(botUploadDir)) {
    fs.mkdirSync(botUploadDir, {
        recursive: true
    });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, botUploadDir);
    },

    filename: (req, file, cb) => {

        const ext =
            path.extname(file.originalname)
                .toLowerCase();

        const nome =
            `${Date.now()}-${crypto.randomUUID()}${ext}`;

        cb(null, nome);
    }

});

const uploadBotImage = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
            return cb(
                new Error(
                    "A imagem precisa ser JPG, PNG ou WEBP."
                )
            );
        }

        cb(null, true);
    }

});

const profileUploadDir = path.join(
    __dirname,
    "public",
    "uploads",
    "profiles"
);

if (!fs.existsSync(profileUploadDir)) {
    fs.mkdirSync(profileUploadDir, {
        recursive: true
    });
}

const profileStorage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, profileUploadDir);
    },

    filename: (req, file, cb) => {

        const ext =
            path.extname(file.originalname)
                .toLowerCase();

        const nome =
            `${req.params.id}-${Date.now()}-${crypto.randomUUID()}${ext}`;

        cb(null, nome);
    }

});

const uploadProfileImage = multer({

    storage: profileStorage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
            return cb(
                new Error(
                    "A imagem precisa ser JPG, PNG ou WEBP."
                )
            );
        }

        cb(null, true);
    }

});


const databaseDir = path.join(__dirname, "database");
const usersFile = path.join(databaseDir, "users.json");
const botsFile = path.join(databaseDir, "bots.json");

if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
}

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
}

if (!fs.existsSync(botsFile)) {
    fs.writeFileSync(botsFile, "[]");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function readJSON(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return [];
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function hashPassword(password) {
    return crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
}

/* =========================
   PÁGINAS
========================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   API
========================= */

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        app: "BOT HUB",
        version: "1.0.0",
        status: "online"
    });
});

/* =========================
   CONTAS
========================= */

app.post("/api/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Preencha todos os campos."
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "A senha precisa ter pelo menos 6 caracteres."
        });
    }

    const users = readJSON(usersFile);

    if (
        users.some(
            user =>
                user.username.toLowerCase() ===
                username.toLowerCase()
        )
    ) {
        return res.status(409).json({
            success: false,
            message: "Esse nome de usuário já está em uso."
        });
    }

    if (
        users.some(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase()
        )
    ) {
        return res.status(409).json({
            success: false,
            message: "Esse e-mail já está cadastrado."
        });
    }

    const user = {
        id: crypto.randomUUID(),
        username,
        email,
        password: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    users.push(user);
    writeJSON(usersFile, users);

    res.status(201).json({
        success: true,
        message: "Conta criada com sucesso!",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            avatar: user.avatar || null
        }
    });
});

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Informe e-mail e senha."
        });
    }

    const users = readJSON(usersFile);

    const user = users.find(
        item =>
            item.email.toLowerCase() ===
                email.toLowerCase() &&
            item.password === hashPassword(password)
    );

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "E-mail ou senha incorretos."
        });
    }

    res.json({
        success: true,
        message: "Login realizado!",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        }
    });
});

/* =========================
   PERFIL
========================= */

app.post(
    "/api/users/:id/avatar",
    uploadProfileImage.single("avatar"),
    (req, res) => {

        const users = readJSON(usersFile);

        const user = users.find(
            item => item.id === req.params.id
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Selecione uma imagem."
            });
        }

        user.avatar =
            `/uploads/profiles/${req.file.filename}`;

        writeJSON(usersFile, users);

        res.json({
            success: true,
            message: "Foto de perfil atualizada.",
            avatar: user.avatar
        });
    }
);

app.get("/api/users/:id", (req, res) => {
    const users = readJSON(usersFile);
    const bots = readJSON(botsFile);

    const user = users.find(
        item => item.id === req.params.id
    );

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "Usuário não encontrado."
        });
    }

    const userBots = bots.filter(
        bot => bot.creator && bot.creator.id === user.id
    );

    const totalViews = userBots.reduce(
        (total, bot) => total + Number(bot.views || 0),
        0
    );

    res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        },
        stats: {
            bots: userBots.length,
            views: totalViews
        },
        bots: userBots
    });
});

/* =========================
   BOTS
========================= */

app.get("/api/bots", (req, res) => {
    const bots = readJSON(botsFile);

    res.json({
        success: true,
        total: bots.length,
        bots
    });
});

app.get("/api/bots/:id", (req, res) => {
    const bots = readJSON(botsFile);

    const bot = bots.find(
        item => item.id === req.params.id
    );

    if (!bot) {
        return res.status(404).json({
            success: false,
            message: "Bot não encontrado."
        });
    }

    res.json({
        success: true,
        bot
    });
});

app.post("/api/bots/:id/view", (req, res) => {
    const bots = readJSON(botsFile);

    const bot = bots.find(
        item => item.id === req.params.id
    );

    if (!bot) {
        return res.status(404).json({
            success: false,
            message: "Bot não encontrado."
        });
    }

    bot.views = Number(bot.views || 0) + 1;

    writeJSON(botsFile, bots);

    res.json({
        success: true,
        views: bot.views
    });
});

app.post(
    "/api/bots",
    uploadBotImage.single("image"),
    (req, res) => {

        const {
            userId,
            botName,
            description,
            category,
            platform,
            link,
            tags
        } = req.body;

        if (
            !userId ||
            !botName ||
            !description ||
            !category ||
            !platform ||
            !link
        ) {
            return res.status(400).json({
                success: false,
                message: "Preencha todos os campos obrigatórios."
            });
        }

        const users = readJSON(usersFile);

        const user = users.find(
            item => item.id === userId
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Usuário não encontrado."
            });
        }

        const bots = readJSON(botsFile);

        const bot = {
            id: crypto.randomUUID(),
            botName,
            description,
            category,
            platform,
            link,

            image: req.file
                ? `/uploads/bots/${req.file.filename}`
                : "/assets/bot-default.jpg",

            tags: tags
                ? tags
                    .split(",")
                    .map(tag => tag.trim())
                    .filter(Boolean)
                : [],

            creator: {
                id: user.id,
                username: user.username
            },

            views: 0,
            rating: 0,
            createdAt: new Date().toISOString()
        };

        bots.push(bot);
        writeJSON(botsFile, bots);

        res.status(201).json({
            success: true,
            message: "Bot publicado com sucesso!",
            bot
        });
    }
);


/* =========================
   AVALIAÇÕES
========================= */

app.delete("/api/bots/:id", (req, res) => {

    const { userId } = req.body;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Usuário não identificado."
        });
    }

    const bots = readJSON(botsFile);

    const indice = bots.findIndex(
        item => item.id === req.params.id
    );

    if (indice === -1) {
        return res.status(404).json({
            success: false,
            message: "Bot não encontrado."
        });
    }

    const bot = bots[indice];

    if (!bot.creator || bot.creator.id !== userId) {
        return res.status(403).json({
            success: false,
            message: "Você não pode excluir este bot."
        });
    }

    if (bot.image && bot.image.startsWith("/uploads/bots/")) {

        const caminhoImagem = path.join(
            __dirname,
            "public",
            bot.image
        );

        if (fs.existsSync(caminhoImagem)) {
            fs.unlinkSync(caminhoImagem);
        }
    }

    bots.splice(indice, 1);

    writeJSON(botsFile, bots);

    const ratingsFile = path.join(
        databaseDir,
        "ratings.json"
    );

    const ratings = readJSON(ratingsFile);

    const novasRatings = ratings.filter(
        item => item.botId !== bot.id
    );

    writeJSON(
        ratingsFile,
        novasRatings
    );

    res.json({
        success: true,
        message: "Bot excluído com sucesso."
    });
});


app.get("/api/bots/:id/ratings", (req, res) => {
    const bots = readJSON(botsFile);
    const ratings = readJSON(
        path.join(databaseDir, "ratings.json")
    );

    const bot = bots.find(
        item => item.id === req.params.id
    );

    if (!bot) {
        return res.status(404).json({
            success: false,
            message: "Bot não encontrado."
        });
    }

    const botRatings = ratings.filter(
        item => item.botId === bot.id
    );

    const total = botRatings.length;

    const average = total
        ? botRatings.reduce(
            (sum, item) => sum + item.rating,
            0
        ) / total
        : 0;

    res.json({
        success: true,
        average: Number(average.toFixed(1)),
        total
    });
});

app.post("/api/bots/:id/rate", (req, res) => {
    const { userId, rating } = req.body;

    const value = Number(rating);

    if (!userId || !Number.isInteger(value) || value < 1 || value > 5) {
        return res.status(400).json({
            success: false,
            message: "Avaliação inválida."
        });
    }

    const bots = readJSON(botsFile);
    const users = readJSON(usersFile);

    const ratingsFile = path.join(
        databaseDir,
        "ratings.json"
    );

    const ratings = readJSON(ratingsFile);

    const bot = bots.find(
        item => item.id === req.params.id
    );

    const user = users.find(
        item => item.id === userId
    );

    if (!bot) {
        return res.status(404).json({
            success: false,
            message: "Bot não encontrado."
        });
    }

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Usuário não encontrado."
        });
    }

    const existing = ratings.find(
        item =>
            item.botId === bot.id &&
            item.userId === user.id
    );

    if (existing) {
        existing.rating = value;
    } else {
        ratings.push({
            id: crypto.randomUUID(),
            botId: bot.id,
            userId: user.id,
            rating: value,
            createdAt: new Date().toISOString()
        });
    }

    writeJSON(ratingsFile, ratings);

    const botRatings = ratings.filter(
        item => item.botId === bot.id
    );

    const average =
        botRatings.reduce(
            (sum, item) => sum + item.rating,
            0
        ) / botRatings.length;

    bot.rating = Number(average.toFixed(1));

    writeJSON(botsFile, bots);

    res.json({
        success: true,
        message: "Avaliação salva!",
        rating: bot.rating,
        total: botRatings.length
    });
});

/* =========================
   FAVORITOS
========================= */

app.get("/api/users/:id/favorites", (req, res) => {
    const users = readJSON(usersFile);
    const bots = readJSON(botsFile);

    const user = users.find(
        item => item.id === req.params.id
    );

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "Usuário não encontrado."
        });
    }

    const favorites = user.favorites || [];

    const favoriteBots = bots.filter(
        bot => favorites.includes(bot.id)
    );

    res.json({
        success: true,
        favorites: favoriteBots
    });
});

app.post("/api/users/:id/favorites/:botId", (req, res) => {
    const users = readJSON(usersFile);
    const bots = readJSON(botsFile);

    const user = users.find(
        item => item.id === req.params.id
    );

    const bot = bots.find(
        item => item.id === req.params.botId
    );

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "Usuário não encontrado."
        });
    }

    if (!bot) {
        return res.status(404).json({
            success: false,
            message: "Bot não encontrado."
        });
    }

    if (!Array.isArray(user.favorites)) {
        user.favorites = [];
    }

    const index = user.favorites.indexOf(bot.id);

    let favoritado;

    if (index === -1) {
        user.favorites.push(bot.id);
        favoritado = true;
    } else {
        user.favorites.splice(index, 1);
        favoritado = false;
    }

    writeJSON(usersFile, users);

    res.json({
        success: true,
        favoritado,
        total: user.favorites.length
    });
});

app.listen(PORT, () => {
    console.log("");
    console.log("BOT HUB iniciado!");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("API: online");
    console.log("Sistema de contas: ativo");
    console.log("Sistema de bots: ativo");
    console.log("Visualizações: ativo");
    console.log("Perfis: ativo");
    console.log("");
});

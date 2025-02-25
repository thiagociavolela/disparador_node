const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

app.use(cors()); // Adiciona CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Configuração do cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
});

client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Erro ao gerar QR Code:", err);
            return;
        }
        io.emit("qrCode", url);
    });
});

client.on("ready", () => {
    console.log("Dispositivo pronto para disparar!");
    io.emit("ready", "Dispositivo pronto para disparar!");
});

client.on("auth_failure", (msg) => {
    console.error("Falha na autenticação:", msg);
    io.emit("auth_failure", "Falha na autenticação. Escaneie o QR Code novamente.");
});

client.on("disconnected", (reason) => {
    console.error("Cliente desconectado:", reason);
    io.emit("disconnected", "Cliente desconectado. Tentando reconectar...");
    client.initialize();
});

client.initialize();

// Função para ler números de um arquivo
const lerNumerosDoArquivo = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        console.log("Conteúdo do arquivo:", data); // Debug: Mostrar conteúdo do arquivo
        return data.split("\n").map((num) => num.trim()).filter((num) => num);
    } catch (err) {
        console.error("Erro ao ler o arquivo de números:", err.message);
        return [];
    }
};

// Função para enviar mensagens em massa
async function enviarMensagens(message, tarefaId, filePath) {
    let numeros = filePath ? lerNumerosDoArquivo(filePath) : [];

    if (numeros.length === 0) {
        console.error("Nenhum número disponível para envio.");
        return;
    }

    console.log("Números a serem enviados:", numeros);

    for (const numero of numeros) {
        const chatId = `55${numero}@c.us`;
        console.log(`Enviando mensagem para ${chatId}...`);

        try {
            if (message) {
                await client.sendMessage(chatId, message);
                console.log(`Mensagem enviada para ${numero}`);
            }
        } catch (err) {
            console.error(`Erro ao enviar mensagem para ${numero}:`, err.message);
        }

        await new Promise((resolve) => setTimeout(resolve, 50000)); // Aguarda 50s entre envios
    }

    const tarefa = tarefasAgendadas.find((t) => t.id === tarefaId);
    if (tarefa) {
        tarefa.status = "Enviado";
        io.emit("atualizarStatus", { id: tarefaId, status: "Enviado" });
    }

    console.log("Todas as mensagens foram enviadas!");
}

const tarefasAgendadas = [];

app.post("/upload-file", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }
    res.status(200).json({ filePath: req.file.path });
});

// Rota para agendar mensagens
app.post("/schedule-message", (req, res) => {
    const { message, scheduleTime, filePath } = req.body;

    if (!message) {
        return res.status(400).json({ message: "A mensagem é obrigatória." });
    }

    if (!scheduleTime) {
        return res.status(400).json({ message: "A data e hora de agendamento são obrigatórias." });
    }

    const dataAgendada = new Date(scheduleTime);
    const agora = new Date();

    if (dataAgendada <= agora) {
        return res.status(400).json({ message: "O horário deve ser no futuro." });
    }

    const tempoAteEnvio = dataAgendada.getTime() - agora.getTime();

    const id = tarefasAgendadas.length + 1;
    const tarefa = setTimeout(() => {
        enviarMensagens(message, id, filePath);
    }, tempoAteEnvio);

    tarefasAgendadas.push({ id, scheduleTime, status: "Agendado", tarefa });

    res.status(200).json({ message: "Mensagem agendada com sucesso!", id });

    io.emit("novaTarefa", { id, scheduleTime, status: "Agendado" });
});

// Rota para listar mensagens agendadas
app.get("/scheduled-messages", (req, res) => {
    const tarefasSemTimeout = tarefasAgendadas.map(({ id, scheduleTime, status }) => ({
        id,
        scheduleTime,
        status,
    }));

    res.json(tarefasSemTimeout);
});

// Rota para obter informações da instância do WhatsApp
app.get("/instance-info", async (req, res) => {
    try {
        const info = await client.getState();
        const numero = await client.getWid();
        res.json({
            status: info || "DESCONECTADO",
            conectado: info === "CONNECTED",
            numero: numero ? numero.user : null,
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao obter informações da instância" });
    }
});

// Rota para enviar mensagem via HTTP (Frontend)
app.post("/send-message", async (req, res) => {
    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
        return res.status(400).json({ error: "Número e mensagem são obrigatórios" });
    }

    try {
        const chatId = `55${numero}@c.us`;
        await client.sendMessage(chatId, mensagem);
        res.json({ success: true, message: `Mensagem enviada para ${numero}` });
    } catch (error) {
        res.status(500).json({ error: "Erro ao enviar mensagem", details: error.message });
    }
});

app.post("/generate-qrcode", async (req, res) => {
    try {
        await client.destroy(); // Destrói a sessão atual (se houver)
        client.initialize(); // Recria a instância do WhatsApp para gerar um novo QR Code

        res.json({ success: true, message: "Novo QR Code gerado!" });
    } catch (error) {
        console.error("Erro ao gerar QR Code:", error);
        res.status(500).json({ error: "Erro ao gerar QR Code", details: error.message });
    }
});

app.post("/logout", async (req, res) => {
    try {
        const state = await client.getState();
        if (!state) {
            return res.status(400).json({ error: "Cliente do WhatsApp não está conectado" });
        }

        await client.logout();
        io.emit("disconnected", "Dispositivo desconectado pelo usuário.");

        res.json({ success: true, message: "Dispositivo desconectado com sucesso!" });
    } catch (error) {
        console.error("Erro ao desconectar:", error);
        res.status(500).json({ error: "Erro ao desconectar dispositivo", details: error.message });
    }
});

// Configurar WebSockets
io.on("connection", (socket) => {
    console.log("Novo cliente conectado");

    socket.on("disconnect", () => {
        console.log("Cliente desconectado");
    });

    socket.on("requestQRCode", () => {
        console.log("Solicitação de novo QR Code recebida.");
        client.initialize();
    });
});

// Iniciar servidor na porta 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

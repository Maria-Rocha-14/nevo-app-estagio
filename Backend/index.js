require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI. Create Backend/.env from Backend/.env.example and add your MongoDB connection string.");
    process.exit(1);
}

// Importar os Modelos
const ScanSetting = require('./models/ScanSetting');
const User = require('./models/User');
const Badge = require('./models/Badge');
const AdminQuiz = require('./models/AdminQuizzes');

const app = express();
// Substitui o app.use(cors()) antigo por este:
app.use(cors({
    origin: 'https://localhost:5173', // O URL onde o teu React corre
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
})); 
app.use(express.json());

// --- LIGAÇÃO AO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Ligado ao MongoDB Remoto"))
    .catch(err => console.error("❌ Erro ao ligar ao MongoDB:", err));

// --- CONFIGURAÇÃO DO EMAIL (NODEMAILER) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (options) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("EMAIL_USER/EMAIL_PASS not configured. Skipping email send.");
        return;
    }

    await transporter.sendMail(options);
};

// --- ROTAS DA API ---

// 1. REGISTO DE UTILIZADOR (Com email de boas-vindas imediato)
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, dob, skinHistory } = req.body;

        const newUser = new User({
            name,
            email,
            dob: new Date(dob),
            skinHistory,
            createdAt: new Date(),
            lastScanDate: new Date()
        });
        await newUser.save();

        const age = new Date().getFullYear() - new Date(dob).getFullYear();
        const settings = await ScanSetting.find();
        const rule = settings.find(r => age >= r.minAge && age <= r.maxAge);

        let frequencyText = "periodicamente";
        if (rule) {
            const weeks = skinHistory === 'yes' ? rule.intervalWeeksHighRisk : rule.intervalWeeksDefault;
            frequencyText = `de ${weeks} em ${weeks} semanas`;
        }

        await sendEmail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Bem-vindo à Nevo App! 🦎',
            text: `Olá ${name}!\n\nObrigado por te registares. Com base no teu perfil, recomendamos que realizes o teu scan de pele ${frequencyText}.\n\nVamos cuidar da tua pele juntos!`
        });

        res.status(201).json({ message: "User registado e email enviado!", user: newUser });
    } catch (error) {
        res.status(500).json({ error: "Erro no registo: " + error.message });
    }
});

// 2. ATUALIZAÇÃO DE SCAN (Para a US 1.5 - Streak/Frequência)
app.post('/api/update-last-scan', async (req, res) => {
    try {
        const { email } = req.body;
        const today = new Date();

        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { lastScanDate: today },
            {returnDocument: 'after'}
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "Utilizador não encontrado" });
        }

        console.log(`✅ Data de scan atualizada para: ${email}`);
        res.json({ message: "Data de scan atualizada!", lastScanDate: today });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. CONFIGURAÇÕES DE SCAN (Painel Admin)
app.get('/api/scan-settings', async (req, res) => {
    const settings = await ScanSetting.find();
    res.json(settings);
});

app.post('/api/scan-settings', async (req, res) => {
    const newSetting = new ScanSetting(req.body);
    await newSetting.save();
    res.status(201).json(newSetting);
});

app.put('/api/scan-settings/:id', async (req, res) => {
    await ScanSetting.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Regra atualizada!" });
});

app.delete('/api/scan-settings/:id', async (req, res) => {
    await ScanSetting.findByIdAndDelete(req.params.id);
    res.json({ message: "Regra apagada!" });
});

// 4. GESTÃO DE BADGES (Painel Admin)
app.get('/api/badges', async (req, res) => {
    try {
        const badges = await Badge.find();
        res.json(badges);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/badges', async (req, res) => {
    try {
        const newBadge = new Badge(req.body);
        await newBadge.save();
        res.status(201).json(newBadge);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/badges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBadge = await Badge.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedBadge) return res.status(404).json({ error: "Badge não encontrado" });
        res.json(updatedBadge);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/badges/:id', async (req, res) => {
    try {
        await Badge.findByIdAndDelete(req.params.id);
        res.json({ message: "Badge removido!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TAREFA AGENDADA (CRON JOB) ---
const checkScansAndSendReminders = async () => {
    console.log("🔍 Verificando agendamentos de scans...");
    const users = await User.find();
    const settings = await ScanSetting.find();
    const today = new Date();

    for (const user of users) {
        if (!user.dob) continue;

        const age = today.getFullYear() - new Date(user.dob).getFullYear();
        const rule = settings.find(r => age >= r.minAge && age <= r.maxAge);

        if (rule) {
            const weeks = user.skinHistory === 'yes' ? rule.intervalWeeksHighRisk : rule.intervalWeeksDefault;
            const lastScan = user.lastScanDate ? new Date(user.lastScanDate) : new Date(user.createdAt);

            const nextScan = new Date(lastScan);
            nextScan.setDate(nextScan.getDate() + (weeks * 7));

            if (nextScan.toDateString() === today.toDateString()) {
                await sendEmail({
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'Lembrete: Dia do seu Scan Nevo',
                    text: `Olá ${user.name}, hoje é o dia recomendado para o seu scan de pele. Proteja-se!`
                });
                console.log(`📧 Lembrete enviado para ${user.email}`);
            }
        }
    }
};

cron.schedule('0 9 * * *', () => {
    checkScansAndSendReminders();
});

// Rota de Teste
app.get('/api/test-email', async (req, res) => {
    try {
        await sendEmail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Teste de Sistema',
            text: 'O sistema de email está 100% operacional!'
        });
        res.json({ message: "Email enviado!" });
    } catch (e) { res.status(500).send(e.message); }
});

// --- ROTAS DE ADMIN: QUIZZES ---

// GET: Listar todos os quizzes
app.get('/api/admin/quizzes', async (req, res) => {
    try {
        const quizzes = await AdminQuiz.find();
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Criar novo quiz
app.post('/api/admin/quizzes', async (req, res) => {
    try {
        const newQuiz = new AdminQuiz(req.body);
        await newQuiz.save();
        res.status(201).json(newQuiz);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT: Atualizar quiz
app.put('/api/admin/quizzes/:id', async (req, res) => {
    try {
        const updated = await AdminQuiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE: Remover quiz
app.delete('/api/admin/quizzes/:id', async (req, res) => {
    try {
        await AdminQuiz.findByIdAndDelete(req.params.id);
        res.json({ message: "Quiz eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROTAS DE ADMIN: UTILIZADORES ---

// GET: Listar todos os utilizadores da cloud
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Não envia passwords
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH: Mudar estado (Ativo/Suspenso)
app.patch('/api/admin/users/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await User.findByIdAndUpdate(req.params.id, { accountStatus: status });
        res.json({ message: "Estado atualizado" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));

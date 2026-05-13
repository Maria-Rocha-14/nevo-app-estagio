require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// --- AJUSTE DE CAMINHOS PARA O VERCEL ---
// Como o index.js está em /api, precisamos de ../ para chegar à pasta /models na raiz
const ScanSetting = require('./models/ScanSetting');
const User = require('./models/User');
const Badge = require('./models/Badge');
const AdminQuiz = require('./models/AdminQuizzes');

const app = express();

// --- CONFIGURAÇÃO DE CORS BLINDADA ---
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://localhost:5173',
        'https://nevo-xi.vercel.app' 
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());

// --- LIGAÇÃO AO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Ligado ao MongoDB Remoto"))
    .catch(err => console.error("❌ Erro ao ligar ao MongoDB:", err));

// --- CONFIGURAÇÃO DO EMAIL ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- LÓGICA DE LEMBRETES (CRON JOB) ---
const checkScansAndSendReminders = async () => {
    console.log("🔍 Verificando agendamentos de scans...");
    try {
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
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: user.email,
                        subject: 'Lembrete: Dia do seu Scan Nevo',
                        text: `Olá ${user.name}, hoje é o dia recomendado para o seu scan de pele. Proteja-se!`
                    });
                    console.log(`📧 Lembrete enviado para ${user.email}`);
                }
            }
        }
    } catch (err) {
        console.error("Erro no Cron Job:", err);
    }
};

cron.schedule('0 9 * * *', () => {
    checkScansAndSendReminders();
});

// --- ROTAS DA API ---

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, dob, skinHistory } = req.body;
        const newUser = new User({
            name, email, dob: new Date(dob), skinHistory,
            createdAt: new Date(), lastScanDate: new Date()
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

        // Email com tratamento de erro interno (para não crashar o registo)
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Bem-vindo à Nevo App! 🦎',
                text: `Olá ${name}!\n\nObrigado por te registares. Com base no teu perfil, recomendamos que realizes o teu scan de pele ${frequencyText}.`
            });
        } catch (e) { console.error("Email falhou:", e); }

        res.status(201).json({ message: "User registado!", user: newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/update-last-scan', async (req, res) => {
    try {
        const { email } = req.body;
        const updatedUser = await User.findOneAndUpdate({ email }, { lastScanDate: new Date() }, { new: true });
        if (!updatedUser) return res.status(404).json({ error: "Utilizador não encontrado" });
        res.json({ message: "Data atualizada!", lastScanDate: updatedUser.lastScanDate });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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

app.get('/api/badges', async (req, res) => {
    try { res.json(await Badge.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/badges', async (req, res) => {
    try { const b = new Badge(req.body); await b.save(); res.status(201).json(b); } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/badges/:id', async (req, res) => {
    try { await Badge.findByIdAndDelete(req.params.id); res.json({ message: "Removido!" }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/quizzes', async (req, res) => {
    try { res.json(await AdminQuiz.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/quizzes', async (req, res) => {
    try { const q = new AdminQuiz(req.body); await q.save(); res.status(201).json(q); } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/admin/quizzes/:id', async (req, res) => {
    try { await AdminQuiz.findByIdAndDelete(req.params.id); res.json({ message: "Quiz eliminado" }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/users', async (req, res) => {
    try { res.json(await User.find({}, '-password')); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/users/:id/status', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { accountStatus: req.body.status });
        res.json({ message: "Estado atualizado" });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/test-email', async (req, res) => {
    try {
        await transporter.sendMail({ from: process.env.EMAIL_USER, to: process.env.EMAIL_USER, subject: 'Teste', text: 'OK' });
        res.json({ message: "Email enviado!" });
    } catch (e) { res.status(500).send(e.message); }
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));
}

module.exports = app; 
export default app;
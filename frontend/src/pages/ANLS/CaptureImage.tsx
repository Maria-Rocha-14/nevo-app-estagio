import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useEffect } from 'react';
import {
    Camera,
    Upload,
    Home,
    History,
    BookOpen,
    Lightbulb
} from 'lucide-react';
import './CaptureImage.css';
import FeedbackMessage from '../../components/FeedbackMessage';
import { appendAssessmentHistory } from '../../services/session';

type RiskLevel = 'low' | 'moderate' | 'high';
type DemoScenario = 'auto' | RiskLevel;

type FeedbackState = {
    tone: 'success' | 'error' | 'warning' | 'info';
    message: string;
};

export default function CaptureImage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // 🔹 Referência ao input escondido (para abrir galeria)
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🔹 Estado para guardar a imagem selecionada (preview)
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [selectedFileSize, setSelectedFileSize] = useState<number>(0);
    const [demoScenario, setDemoScenario] = useState<DemoScenario>('auto');
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);

    // 🔹 Estados da câmara
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 🔹 Limpar a stream da câmara quando o componente for desmontado
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setIsCameraActive(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            setFeedback({ tone: 'error', message: t('feedback.scan_camera_permission_denied') || 'Não foi possível aceder à câmara. Verifique as permissões.' });
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const imageUrl = URL.createObjectURL(blob);
                        setSelectedImage(imageUrl);
                        setSelectedFileName(`camera_${Date.now()}.jpg`);
                        setSelectedFileSize(blob.size);
                        setDemoScenario('auto');
                        setFeedback({ tone: 'success', message: t('feedback.scan_image_loaded') || 'Fotografia capturada com sucesso.' });
                        stopCamera();
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    const getMockAssessment = (fileSize: number, scenario: DemoScenario) => {
        if (scenario === 'low') {
            return { probability: 22, riskLevel: 'low' as const };
        }

        if (scenario === 'moderate') {
            return { probability: 56, riskLevel: 'moderate' as const };
        }

        if (scenario === 'high') {
            return { probability: 83, riskLevel: 'high' as const };
        }

        const probability = Math.min(95, Math.max(8, Math.round((fileSize % 100000) / 1000)));

        if (probability >= 70) {
            return { probability, riskLevel: 'high' as const };
        }

        if (probability >= 35) {
            return { probability, riskLevel: 'moderate' as const };
        }

        return { probability, riskLevel: 'low' as const };
    };

    // 🔹 Abre o file picker (galeria)
    const handleOpenGallery = () => {
        fileInputRef.current?.click();
    };

    // 🔹 Quando o user escolhe um ficheiro
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 🔹 Validação básica → só imagens
        if (!file.type.startsWith('image/')) {
            setFeedback({ tone: 'error', message: t('feedback.scan_invalid_image') });
            return;
        }

        // 🔹 Criar URL para preview da imagem
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
        setSelectedFileName(file.name);
        setSelectedFileSize(file.size);
        setDemoScenario('auto');
        setFeedback({ tone: 'success', message: t('feedback.scan_image_loaded') });
    };

    // 🔹 Cancelar preview → volta ao estado inicial
    const handleCancel = () => {
        setSelectedImage(null);
        setSelectedFileName('');
        setSelectedFileSize(0);
        setDemoScenario('auto');
        setFeedback({ tone: 'info', message: t('feedback.scan_selection_canceled') });
    };

    const handleConfirm = () => {
        if (!selectedImage) {
            setFeedback({ tone: 'error', message: t('feedback.scan_invalid_image') });
            return;
        }

        const mockAssessment = getMockAssessment(selectedFileSize, demoScenario);

        appendAssessmentHistory({
            createdAt: new Date().toISOString(),
            fileName: selectedFileName,
            probability: mockAssessment.probability,
            riskLevel: mockAssessment.riskLevel,
            simulated: true
        });

        navigate('/assessment-results', {
            state: {
                imageUrl: selectedImage,
                fileName: selectedFileName,
                probability: mockAssessment.probability,
                riskLevel: mockAssessment.riskLevel,
                isSimulated: true
            }
        });
    };

    return (
        <div className="capture-container">

            {/* 🔹 HEADER */}
            <header className="capture-header">
                <h1>{t('scan.title')}</h1>
            </header>

            {feedback && (
                <FeedbackMessage
                    tone={feedback.tone}
                    message={feedback.message}
                    onClose={() => setFeedback(null)}
                />
            )}

            {/* 🔹 INPUT escondido (usado pelo botão de upload) */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {/* 🔹 MOSTRAR CARDS (estado inicial) */}
            {!selectedImage && (
                <>
                    <section className="scan-options">

                        {/* Tirar Foto */}
                        <button
                            className="scan-option-card"
                            onClick={startCamera}
                        >
                            <div className="scan-option-icon camera-icon">
                                <Camera size={30} color="#5fa79a" strokeWidth={2.3} />
                            </div>
                            <h3>{t('scan.take_photo')}</h3>
                            <p>{t('scan.take_photo_desc')}</p>
                        </button>

                        {/* 🔹 Upload da galeria (funcional) */}
                        <button
                            className="scan-option-card"
                            onClick={handleOpenGallery}
                        >
                            <div className="scan-option-icon upload-icon">
                                <Upload size={30} color="#4a90e2" strokeWidth={2.3} />
                            </div>
                            <h3>{t('scan.upload_gallery')}</h3>
                            <p>{t('scan.upload_gallery_desc')}</p>
                        </button>
                    </section>

                    {/* 🔹 Caixa de dicas */}
                    <section className="scan-tips-card">
                        <div className="scan-tips-title">
                            <Lightbulb size={18} color="#f4b400" />
                            <h3>{t('scan.tips_title')}</h3>
                        </div>

                        <ul className="scan-tips-list">
                            <li>{t('scan.tip_1')}</li>
                            <li>{t('scan.tip_2')}</li>
                            <li>{t('scan.tip_3')}</li>
                            <li>{t('scan.tip_4')}</li>
                            <li>{t('scan.tip_5')}</li>
                        </ul>
                    </section>
                </>
            )}

            {/* 🔹 LIVE PREVIEW DA CÂMARA */}
            {isCameraActive && (
                <div className="camera-live-container">
                    <div className="camera-view">
                        <video ref={videoRef} className="camera-video" playsInline />
                        <div className="camera-overlay">
                            <div className="reticle"></div>
                            <p className="camera-hint">{t('scan.camera_hint') || 'Centre a lesão no círculo'}</p>
                        </div>
                    </div>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="camera-actions">
                        <button className="capture-btn" onClick={takePhoto}>
                            <Camera size={32} />
                        </button>
                        <button className="cancel-camera-btn" onClick={stopCamera}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* 🔹 PREVIEW DA IMAGEM (depois de selecionar) */}
            {selectedImage && !isCameraActive && (
                <div className="preview-container">

                    {/* Imagem escolhida */}
                    <img
                        src={selectedImage}
                        alt="preview"
                        className="preview-image"
                    />

                    {/* Botões de ação */}
                    <div className="demo-controls" aria-label={t('assessment.demo_selector_label')}>
                        <p>{t('assessment.demo_selector_title')}</p>
                        <div className="demo-options">
                            <button type="button" className={`demo-option ${demoScenario === 'auto' ? 'active' : ''}`} onClick={() => setDemoScenario('auto')}>{t('assessment.demo_auto')}</button>
                            <button type="button" className={`demo-option ${demoScenario === 'low' ? 'active' : ''}`} onClick={() => setDemoScenario('low')}>{t('assessment.demo_low')}</button>
                            <button type="button" className={`demo-option ${demoScenario === 'moderate' ? 'active' : ''}`} onClick={() => setDemoScenario('moderate')}>{t('assessment.demo_moderate')}</button>
                            <button type="button" className={`demo-option ${demoScenario === 'high' ? 'active' : ''}`} onClick={() => setDemoScenario('high')}>{t('assessment.demo_high')}</button>
                        </div>
                    </div>

                    <div className="preview-actions">
                        <button
                            className="confirm-btn"
                            onClick={handleConfirm}
                        >
                            Confirmar
                        </button>

                        <button
                            className="cancel-btn"
                            onClick={handleCancel}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* 🔹 NAVBAR */}
            <nav className="bottom-navbar">
                <button className="nav-btn" onClick={() => navigate('/homepage')}>
                    <Home size={24} />
                    <span>{t('nav.home')}</span>
                </button>

                <button className="nav-btn active">
                    <Camera size={24} />
                    <span>{t('nav.scan')}</span>
                </button>

                <button className="nav-btn" onClick={() => navigate('/history')}>
                    <History size={24} />
                    <span>{t('nav.history')}</span>
                </button>

                <button className="nav-btn" onClick={() => navigate('/learn')}>
                    <BookOpen size={24} />
                    <span>{t('nav.learn')}</span>
                </button>
            </nav>
        </div>
    );
}
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
    Camera,
    Upload,
    Home,
    History,
    BookOpen,
    Lightbulb,
    SwitchCamera
} from 'lucide-react';
import './CaptureImage.css';
import FeedbackMessage from '../../components/FeedbackMessage';
import { appendAssessmentHistory } from '../../services/session';

const BODY_AREA_IDS = [
    'face',
    'neck',
    'trunk',
    'back',
    'left_arm',
    'right_arm',
    'left_hand',
    'right_hand',
    'left_leg',
    'right_leg',
    'left_foot',
    'right_foot'
] as const;

type BodyAreaId = typeof BODY_AREA_IDS[number];

type FeedbackState = {
    tone: 'success' | 'error' | 'warning' | 'info';
    message: string;
};

type CameraFacingMode = 'environment' | 'user';

export default function CaptureImage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // 🔹 Referência ao input escondido (para abrir galeria)
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🔹 Estado para guardar a imagem selecionada (preview)
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFileBlob, setSelectedFileBlob] = useState<Blob | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [selectedFileSize, setSelectedFileSize] = useState<number>(0);
    const [selectedBodyArea, setSelectedBodyArea] = useState<BodyAreaId | ''>('');
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);

    // 🔹 Estados da câmara
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>('environment');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraContainerRef = useRef<HTMLDivElement>(null);

    // 🔹 Limpar a stream da câmara quando o componente for desmontado
    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }, []);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    useEffect(() => {
        return () => {
            if (selectedImage?.startsWith('blob:')) {
                URL.revokeObjectURL(selectedImage);
            }
        };
    }, [selectedImage]);

    useEffect(() => {
        if (!isCameraActive || !cameraContainerRef.current) return;

        requestAnimationFrame(() => {
            cameraContainerRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }, [isCameraActive]);

    const startCamera = async (facingMode: CameraFacingMode = cameraFacingMode) => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setFeedback({ tone: 'warning', message: t('feedback.scan_camera_unavailable') });
            return;
        }

        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode }
            });
            setCameraFacingMode(facingMode);
            setIsCameraActive(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                if (cameraContainerRef.current) {
                    cameraContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } catch {
            setFeedback({ tone: 'error', message: t('feedback.scan_camera_permission_denied') });
        }
    };

    const switchCamera = () => {
        const nextFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
        void startCamera(nextFacingMode);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                if (cameraFacingMode === 'user') {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const imageUrl = URL.createObjectURL(blob);
                        setSelectedImage(imageUrl);
                        setSelectedFileBlob(blob);
                        setSelectedFileName(`camera_${Date.now()}.jpg`);
                        setSelectedFileSize(blob.size);
                        setSelectedBodyArea('');
                        setFeedback({ tone: 'success', message: t('feedback.scan_image_loaded') || 'Fotografia capturada com sucesso.' });
                        stopCamera();
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    const getMockAssessment = (fileSize: number) => {
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
        setSelectedFileBlob(file);
        setSelectedFileName(file.name);
        setSelectedFileSize(file.size);
        setSelectedBodyArea('');
        setFeedback({ tone: 'success', message: t('feedback.scan_image_loaded') });
    };

    // 🔹 Cancelar preview → volta ao estado inicial
    const handleCancel = () => {
        setSelectedImage(null);
        setSelectedFileBlob(null);
        setSelectedFileName('');
        setSelectedFileSize(0);
        setSelectedBodyArea('');
        setFeedback({ tone: 'info', message: t('feedback.scan_selection_canceled') });
    };

    const fileToBase64 = (fileOrBlob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(fileOrBlob);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleConfirm = async () => {
        if (!selectedImage || !selectedFileBlob) {
            setFeedback({ tone: 'error', message: t('feedback.scan_invalid_image') });
            return;
        }

        if (!selectedBodyArea) {
            setFeedback({ tone: 'warning', message: t('feedback.scan_body_area_required') });
            return;
        }

        const bodyAreaLabel = t(`scan.body_area_${selectedBodyArea}`);
        const mockAssessment = getMockAssessment(selectedFileSize);

        try {
            const base64Image = await fileToBase64(selectedFileBlob);

            await appendAssessmentHistory({
                createdAt: new Date().toISOString(),
                fileName: selectedFileName,
                imageUrl: base64Image,
                bodyAreaId: selectedBodyArea,
                bodyAreaLabel,
                probability: mockAssessment.probability,
                riskLevel: mockAssessment.riskLevel,
                simulated: true
            });

            navigate('/assessment-results', {
                state: {
                    imageUrl: base64Image,
                    fileName: selectedFileName,
                    bodyAreaLabel,
                    probability: mockAssessment.probability,
                    riskLevel: mockAssessment.riskLevel,
                    isSimulated: true,
                    returnTo: '/scan'
                }
            });
        } catch (error: unknown) {
            console.error("ERRO COMPLETO:", error);
            const message = error instanceof Error ? error.message : String(error);
            setFeedback({ tone: 'error', message: `Erro ao processar: ${message}` });
        }
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
                            onClick={() => void startCamera()}
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
                <div className="camera-live-container" ref={cameraContainerRef}>
                    <div className="camera-view">
                        <video ref={videoRef} className={`camera-video ${cameraFacingMode === 'user' ? 'front-camera' : ''}`} playsInline />
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
                        <button className="switch-camera-btn" onClick={switchCamera}>
                            <SwitchCamera size={20} />
                            {cameraFacingMode === 'environment' ? 'Frontal' : 'Traseira'}
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
                    <div className="body-area-controls" aria-label={t('scan.body_area_label')}>
                        <p>{t('scan.body_area_title')}</p>
                        <div className="body-area-options">
                            {BODY_AREA_IDS.map((areaId) => (
                                <button
                                    key={areaId}
                                    type="button"
                                    className={`body-area-option ${selectedBodyArea === areaId ? 'active' : ''}`}
                                    onClick={() => setSelectedBodyArea(areaId)}
                                >
                                    {t(`scan.body_area_${areaId}`)}
                                </button>
                            ))}
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

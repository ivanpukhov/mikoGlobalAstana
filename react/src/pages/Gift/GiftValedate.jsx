import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Typography, CircularProgress, Card, CardContent, Button, Box } from "@mui/material";
import { CheckCircle, ErrorOutline } from "@mui/icons-material";
import api from "../../api/api";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { formatCurrency } from "../../utils/formatters";

export const GiftValidate = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const fetchGiftCertificate = async () => {
            try {
                const response = await api.get(`/purchased-certificates/validate/${id}`);
                setCertificate(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "Ошибка при проверке сертификата.");
            } finally {
                setLoading(false);
            }
        };

        fetchGiftCertificate();
        window.addEventListener("resize", () => setWindowSize({ width: window.innerWidth, height: window.innerHeight }));
    }, [id]);

    const handleActivate = () => {
        if (certificate && certificate.valid) {
            localStorage.setItem("gift", id);
            Swal.fire({
                title: "Сертификат активирован!",
                text: "Приятного использования 🎉",
                icon: "success",
                confirmButtonText: "Перейти",
                showCancelButton: true,
                cancelButtonText: "Закрыть",
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "https://miko.com.kz/";
                }
            });
        }
    };

    return (
        <Container maxWidth={false} sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #ff9a9e, #fad0c4)", width: "100%" }}>
            {loading ? (
                <CircularProgress color="secondary" size={80} />
            ) : error ? (
                <Card sx={{ padding: 4, textAlign: "center", boxShadow: 3, backgroundColor: "white" }}>
                    <ErrorOutline color="error" sx={{ fontSize: 60 }} />
                    <Typography variant="h5" color="error" sx={{ marginTop: 2 }}>Ошибка</Typography>
                    <Typography>{error}</Typography>
                </Card>
            ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    {certificate.valid && <Confetti width={windowSize.width} height={windowSize.height} />}
                    <Card sx={{ padding: 6, textAlign: "center", boxShadow: 5, backgroundColor: "white", borderRadius: 4 }}>
                        <CardContent>
                            <Box component="img" src={certificate.giftCertificate.imageUrl} sx={{ maxWidth: 321, maxHeight: 189, width: '100%', margin: "0 auto", borderRadius: '10px', objectFit: "cover" }} />
                            <Typography variant="h4" fontWeight={700} color="primary" sx={{ mt: 2 }}>{certificate.giftCertificate.name}</Typography>
                            <Typography variant="h6" sx={{ mt: 2, color: "gray" }}>🎁 Вам подарили сертификат на сумму:</Typography>
                            <Typography variant="h3" color="success.main" fontWeight={700} sx={{ mt: 1 }}>{formatCurrency(certificate.amount, "KZT")}</Typography>
                            <Typography variant="body1" sx={{ mt: 2 }}>Отправитель: <strong>{certificate.senderPhone}</strong></Typography>
                            <Box mt={4}>
                                <motion.div whileHover={{ scale: 1.1 }}>
                                    <Button
                                        onClick={handleActivate}
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        sx={{ padding: "12px 24px", fontSize: "1.2rem", borderRadius: "30px" }}
                                        startIcon={<CheckCircle />}
                                    >
                                        Активировать подарок 🎉
                                    </Button>
                                </motion.div>
                            </Box>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </Container>
    );
};

import React, { useState } from 'react';
import { Button, Radio, Card, Typography, Progress } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text } = Typography;

const questions = [
    { question: "Как ваша кожа выглядит через несколько часов после умывания без крема?", options: ["Очень сухая", "Немного сухая", "Нормальная", "Жирная", "Очень жирная"] },
    { question: "Как часто у вас появляются высыпания?", options: ["Никогда", "Очень редко", "Иногда", "Довольно часто", "Постоянно"] },
    { question: "Чувствуете ли вы стянутость кожи после умывания?", options: ["Всегда", "Иногда", "Нет", "Редко", "Никогда"] },
    { question: "Как кожа реагирует на новые косметические средства?", options: ["Очень чувствительно", "Иногда реагирует", "Нет реакции", "Забиваются поры", "Часто воспаления"] },
    { question: "Насколько у вас выражены поры?", options: ["Очень мелкие", "Небольшие", "Средние", "Заметные", "Крупные"] },
    { question: "Замечаете ли вы шелушение на коже?", options: ["Часто", "Иногда", "Редко", "Очень редко", "Нет"] },
    { question: "Как ваша кожа реагирует на солнце?", options: ["Быстро краснеет", "Немного чувствительна", "Ровный загар", "Адаптируется быстро", "Никогда не краснеет"] },
    { question: "Есть ли возрастные изменения?", options: ["Выраженные", "Небольшие морщины", "Нет изменений", "Небольшая потеря упругости", "Кожа упругая"] },
    { question: "Есть ли гиперпигментация?", options: ["Нет", "Веснушки", "Редко следы", "Темные пятна", "Выраженная"] },
    { question: "Какую текстуру крема вы предпочитаете?", options: ["Плотный", "Легкий", "Крем-гель", "Флюид", "Гель"] }
];

const skinTypes = {
    "1": "Сухая кожа",
    "2": "Чувствительная кожа",
    "3": "Нормальная кожа",
    "4": "Комбинированная кожа",
    "5": "Жирная кожа"
};

const variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

const SkinTypeQuiz = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);

    const onChange = (e) => {
        setAnswers({ ...answers, [currentQuestion]: e.target.value });
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            const counts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
            Object.values(answers).forEach(val => counts[val] += 1);
            const maxKey = Object.keys(counts).reduce((a, b) => counts[a] >= counts[b] ? a : b);
            setResult(skinTypes[maxKey]);
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', backgroundColor: '#f7faff' }}>
            <Card style={{ width: '600px', borderRadius: '16px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                {result === null ? (
                    <AnimatePresence exitBeforeEnter>
                        <motion.div key={currentQuestion} variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                            <Progress percent={((currentQuestion + 1) / questions.length) * 100} showInfo={false} strokeColor="#0CE3CB" style={{ marginBottom: '20px' }} />
                            <Title level={4} style={{ marginBottom: '20px', color: '#333' }}>{questions[currentQuestion].question}</Title>
                            <Radio.Group onChange={onChange} value={answers[currentQuestion]} style={{ width: '100%' }}>
                                {questions[currentQuestion].options.map((option, i) => (
                                    <motion.div key={i} whileHover={{ scale: 1.03 }} style={{ marginBottom: '12px', background: '#fafcff', borderRadius: '8px', padding: '10px', border: '1px solid #e8f4ff' }}>
                                        <Radio value={(i + 1).toString()}>{option}</Radio>
                                    </motion.div>
                                ))}
                            </Radio.Group>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                                {currentQuestion > 0 && <Button onClick={handlePrev}>Назад</Button>}
                                <Button type="primary" onClick={handleNext} disabled={!answers[currentQuestion]}>
                                    {currentQuestion === questions.length - 1 ? 'Показать результат' : 'Далее'}
                                </Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Title level={2}>Ваш тип кожи:</Title>
                        <Text style={{ fontSize: '20px', color: '#0CE3CB', fontWeight: 'bold' }}>{result}</Text>
                    </motion.div>
                )}
            </Card>
        </div>
    );
};

export default SkinTypeQuiz;

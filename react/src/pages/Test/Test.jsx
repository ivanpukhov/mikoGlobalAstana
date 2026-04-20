import { useState } from 'react';
import { Box, Button, Card, Center, Group, Paper, Progress, Radio, Stack, Text, Title } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';

const questions = [
    { question: 'Как ваша кожа выглядит через несколько часов после умывания без крема?', options: ['Очень сухая', 'Немного сухая', 'Нормальная', 'Жирная', 'Очень жирная'] },
    { question: 'Как часто у вас появляются высыпания?', options: ['Никогда', 'Очень редко', 'Иногда', 'Довольно часто', 'Постоянно'] },
    { question: 'Чувствуете ли вы стянутость кожи после умывания?', options: ['Всегда', 'Иногда', 'Нет', 'Редко', 'Никогда'] },
    { question: 'Как кожа реагирует на новые косметические средства?', options: ['Очень чувствительно', 'Иногда реагирует', 'Нет реакции', 'Забиваются поры', 'Часто воспаления'] },
    { question: 'Насколько у вас выражены поры?', options: ['Очень мелкие', 'Небольшие', 'Средние', 'Заметные', 'Крупные'] },
    { question: 'Замечаете ли вы шелушение на коже?', options: ['Часто', 'Иногда', 'Редко', 'Очень редко', 'Нет'] },
    { question: 'Как ваша кожа реагирует на солнце?', options: ['Быстро краснеет', 'Немного чувствительна', 'Ровный загар', 'Адаптируется быстро', 'Никогда не краснеет'] },
    { question: 'Есть ли возрастные изменения?', options: ['Выраженные', 'Небольшие морщины', 'Нет изменений', 'Небольшая потеря упругости', 'Кожа упругая'] },
    { question: 'Есть ли гиперпигментация?', options: ['Нет', 'Веснушки', 'Редко следы', 'Тёмные пятна', 'Выраженная'] },
    { question: 'Какую текстуру крема вы предпочитаете?', options: ['Плотный', 'Лёгкий', 'Крем-гель', 'Флюид', 'Гель'] },
];

const skinTypes = {
    '1': 'Сухая кожа',
    '2': 'Чувствительная кожа',
    '3': 'Нормальная кожа',
    '4': 'Комбинированная кожа',
    '5': 'Жирная кожа',
};

const variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

const SkinTypeQuiz = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion((q) => q + 1);
        } else {
            const counts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
            Object.values(answers).forEach((val) => { counts[val] += 1; });
            const maxKey = Object.keys(counts).reduce((a, b) => (counts[a] >= counts[b] ? a : b));
            setResult(skinTypes[maxKey]);
        }
    };

    return (
        <Center mih="80vh" py="xl">
            <Card w={{ base: '100%', sm: 600 }} radius="xl" shadow="lg" p="xl">
                {result === null ? (
                    <Stack gap="lg">
                        <Progress
                            value={((currentQuestion + 1) / questions.length) * 100}
                            color="miko"
                            radius="xl"
                            size="sm"
                        />
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestion}
                                variants={variants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <Stack gap="md">
                                    <Text size="sm" c="dimmed">
                                        Вопрос {currentQuestion + 1} из {questions.length}
                                    </Text>
                                    <Title order={4} fw={700}>
                                        {questions[currentQuestion].question}
                                    </Title>
                                    <Radio.Group
                                        value={answers[currentQuestion]}
                                        onChange={(val) =>
                                            setAnswers({ ...answers, [currentQuestion]: val })
                                        }
                                    >
                                        <Stack gap="sm">
                                            {questions[currentQuestion].options.map((option, i) => (
                                                <motion.div
                                                    key={i}
                                                    whileHover={{ scale: 1.02 }}
                                                    transition={{ type: 'spring', stiffness: 300 }}
                                                >
                                                    <Paper
                                                        withBorder
                                                        p="md"
                                                        radius="lg"
                                                        style={{
                                                            cursor: 'pointer',
                                                            borderColor:
                                                                answers[currentQuestion] === String(i + 1)
                                                                    ? '#0CE3CB'
                                                                    : undefined,
                                                        }}
                                                        onClick={() =>
                                                            setAnswers({
                                                                ...answers,
                                                                [currentQuestion]: String(i + 1),
                                                            })
                                                        }
                                                    >
                                                        <Radio
                                                            value={String(i + 1)}
                                                            label={option}
                                                            color="miko"
                                                            styles={{ label: { cursor: 'pointer' } }}
                                                        />
                                                    </Paper>
                                                </motion.div>
                                            ))}
                                        </Stack>
                                    </Radio.Group>
                                    <Group justify="space-between" mt="sm">
                                        {currentQuestion > 0 && (
                                            <Button
                                                variant="default"
                                                radius="xl"
                                                onClick={() => setCurrentQuestion((q) => q - 1)}
                                            >
                                                Назад
                                            </Button>
                                        )}
                                        <Button
                                            color="miko"
                                            radius="xl"
                                            disabled={!answers[currentQuestion]}
                                            onClick={handleNext}
                                            ml="auto"
                                        >
                                            {currentQuestion === questions.length - 1
                                                ? 'Показать результат'
                                                : 'Далее'}
                                        </Button>
                                    </Group>
                                </Stack>
                            </motion.div>
                        </AnimatePresence>
                    </Stack>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Stack align="center" gap="md" py="xl">
                            <Title order={2} fw={800}>Ваш тип кожи:</Title>
                            <Text size="xl" fw={700} c="miko">
                                {result}
                            </Text>
                            <Button
                                variant="light"
                                color="miko"
                                radius="xl"
                                mt="md"
                                onClick={() => { setResult(null); setCurrentQuestion(0); setAnswers({}); }}
                            >
                                Пройти снова
                            </Button>
                        </Stack>
                    </motion.div>
                )}
            </Card>
        </Center>
    );
};

export default SkinTypeQuiz;

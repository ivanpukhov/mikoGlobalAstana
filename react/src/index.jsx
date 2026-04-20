import React from 'react';
import ReactDOM from 'react-dom/client';

// Mantine styles must be imported before our own styles so that our overrides win.
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/charts/styles.css';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import { theme } from './theme';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

dayjs.locale('ru');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <MantineProvider theme={theme} defaultColorScheme="light">
            <DatesProvider settings={{ locale: 'ru', firstDayOfWeek: 1, weekendDays: [0, 6] }}>
                <ModalsProvider>
                    <Notifications position="top-right" zIndex={2077} />
                    <App />
                </ModalsProvider>
            </DatesProvider>
        </MantineProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

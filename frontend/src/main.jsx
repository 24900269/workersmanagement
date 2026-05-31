import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-center"
        containerStyle={{ bottom: 90 }}
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1D9E75',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '20px',
            padding: '10px 20px',
            boxShadow: '0 4px 16px rgba(29,158,117,0.3)',
          },
          error: {
            style: {
              background: '#E24B4A',
              color: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);

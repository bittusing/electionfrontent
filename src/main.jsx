import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('main.jsx loading...');
console.log('React version:', React.version);

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('React app mounted successfully!');
} else {
  console.error('Root element not found!');
}

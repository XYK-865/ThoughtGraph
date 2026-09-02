import React from 'react'
import ReactDOM from 'react-dom/client'

async function bootstrap() {
  const isPortfolioBuild = import.meta.env.MODE === 'github'

  if (isPortfolioBuild) {
    const [{ default: DemoApp }] = await Promise.all([
      import('@/demo/DemoApp'),
      import('@/demo/demo.css'),
    ])
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <DemoApp />
      </React.StrictMode>,
    )
    return
  }

  const [{ default: App }] = await Promise.all([
    import('@/App.jsx'),
    import('@/index.css'),
  ])
  ReactDOM.createRoot(document.getElementById('root')).render(<App />)
}

bootstrap()

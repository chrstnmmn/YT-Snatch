import { useState, useEffect } from 'react'
import Logo from './components/Logo'
import InputFieldSection from './components/InputField'
import ProgressSection from './components/ProgressSection'
import DownloadComplete from './components/DownloadComplete'

import exit from './assets/exit.svg'

function ExitButton() {
  const handleClose = () => {
    console.log('Now closing...')
    window.api.send('close-app')
  }
  return (
    <button className="no-drag" onClick={handleClose}>
      <img src={exit}></img>
    </button>
  )
}

function TitleBar() {
  return (
    <div className="w-[100vw] flex justify-end px-3 py-3 relative md:absolute top-0 drag">
      <ExitButton></ExitButton>
    </div>
  )
}

function RenderPage() {
  const [isDownloading, setDownloading] = useState(false)
  const [isDownloadComplete, setDownloadComplete] = useState(false)

  useEffect(() => {
    console.log(`Current state - Downloading: ${isDownloading}, Complete: ${isDownloadComplete}`)
  }, [isDownloading, isDownloadComplete])

  const handleReset = () => {
    setDownloading(false)
    setDownloadComplete(false)
  }

  const bodyStyle = 'w-[100vw] flex flex-col justify-center items-center no-drag gap-2 select-none'

  if (isDownloadComplete) {
    return (
      <section className={bodyStyle}>
        <DownloadComplete onReset={handleReset} />
      </section>
    )
  }

  if (isDownloading) {
    return (
      <section className={bodyStyle}>
        <ProgressSection
          setDownloading={setDownloading}
          setDownloadComplete={setDownloadComplete}
        />
      </section>
    )
  }

  return (
    <section className={bodyStyle}>
      <InputFieldSection setDownloading={setDownloading} />
    </section>
  )
}

function App() {
  return (
    <>
      <TitleBar></TitleBar>
      <RenderPage />
    </>
  )
}

export default App

import { useState, useEffect } from 'react'
import InputFieldSection from './components/InputField'
import ProgressSection from './components/ProgressSection'
import DownloadComplete from './components/DownloadComplete'

function ExitButton() {
  const handleClose = () => {
    console.log('Now closing...')
    window.api.send('close-app')
  }
  return (
    <button className="no-drag" onClick={handleClose}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="19"
        height="18"
        viewBox="0 0 19 18"
        fill="none"
      >
        <path
          d="M9.5 18C14.4706 18 18.5 13.9706 18.5 9C18.5 4.02944 14.4706 0 9.5 0C4.52944 0 0.5 4.02944 0.5 9C0.5 13.9706 4.52944 18 9.5 18Z"
          fill="white"
        />
        <path
          d="M12.4355 6.06461L6.5647 11.9354"
          stroke="#000001"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M6.5647 6.06461L12.4355 11.9354"
          stroke="#000001"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  )
}

function MinimizeButton() {
  const handleMinimize = () => {
    console.log('App minimized')
    window.api.send('minimize-app')
  }

  return (
    <button className="no-drag" onClick={handleMinimize}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="19"
        height="18"
        viewBox="0 0 19 18"
        fill="none"
      >
        <path
          d="M9.25671 18C14.2273 18 18.2567 13.9706 18.2567 9C18.2567 4.02944 14.2273 0 9.25671 0C4.28615 0 0.256714 4.02944 0.256714 9C0.256714 13.9706 4.28615 18 9.25671 18Z"
          fill="white"
        />
        <path
          d="M5.10291 9H13.4106"
          stroke="#000001"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  )
}

function TitleBar() {
  return (
    <div className="w-[100vw] flex justify-end gap-x-2 px-3 py-3 relative md:absolute top-0 drag">
      <MinimizeButton></MinimizeButton>
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

import { useEffect, useState } from 'react'
import QualityOptions from './QualityOption'
import Button from './Button'
import downloadIcon from '../assets/download.svg'
import folderIcon from '../assets/folder.svg'

function InputField({ inputs }) {
  const style =
    'h-[2.25rem] rounded-3xl bg-button-black border-2 border-accent-gray outline-none px-5 text-[1rem] font-extralight text-center text-accent-white placeholder:text-accent-gray select-none'

  return (
    <>
      {inputs.map((input, index) => (
        <input
          key={index}
          placeholder={input.placeholder}
          name={input.name}
          className={`${input.span} ${input.width} ${style}`.trim()}
          type={input.type || 'text'}
          value={input.value || ''}
          readOnly={input.readOnly || false}
          onChange={input.onChange || (() => {})}
        />
      ))}
    </>
  )
}

function DownloadButton({ url, selectedFolder, selectedQuality, setDownloading }) {
  // Compute download readiness based on all required values being present
  const isDownloadReady = url && selectedFolder && selectedQuality

  // Set border style conditionally based on download readiness
  const borderStyle = isDownloadReady
    ? 'w-[8.4rem] h-[2.9rem] linear-gradient animate-pulse shadow-glow mt-2 rounded-full flex justify-center items-center'
    : ''
  const handleClick = () => {
    if (!url) {
      console.log('No URL provided')
      return
    }
    if (!selectedFolder) {
      console.log('No download folder selected')
      return
    }
    if (!selectedQuality) {
      console.log('No quality selected')
      return
    }

    console.log(`Now Downloading: ${url} at ${selectedQuality} -> Folder: ${selectedFolder}`)

    // Send data to Electron's main process via IPC
    window.api.send('download-video', { url, selectedFolder, selectedQuality })

    // Hide input section and show progress section
    setDownloading(true)
  }

  // Button styling with disabled state
  const buttonStyle = `text-accent-white text-sm font-extrabold w-[8.19rem] h-[2.75rem] bg-button-black border-2 
    ${isDownloadReady ? 'border-accent-gray' : 'border-gray-700 opacity-70 cursor-not-allowed'} 
    rounded-full flex items-center justify-center gap-1`

  return (
    <div className={borderStyle}>
      <button onClick={handleClick} className={buttonStyle} disabled={!isDownloadReady}>
        <img src={downloadIcon} alt="Download Icon" />
        Download
      </button>
    </div>
  )
}
export default function InputFieldSection({ setDownloading }) {
  const [url, setUrl] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('')
  const [selectedQuality, setSelectedQuality] = useState(null)

  const handleUrlChange = (event) => {
    setUrl(event.target.value)
    console.log('User Input:', event.target.value)
  }

  const handleSelectFolder = () => {
    window.api.send('open-message-dialog')
  }

  useEffect(() => {
    const handleFolderSelected = (folderPath) => {
      // Handle both string and object formats for backward compatibility
      const path = typeof folderPath === 'string' ? folderPath : folderPath?.data || ''
      setSelectedFolder(path)
      console.log('Selected Folder:', path)
    }

    window.api.on('selected-folder', handleFolderSelected)

    return () => {
      window.api.removeListener('selected-folder', handleFolderSelected)
    }
  }, [])

  return (
    <>
      <div className="grid grid-cols-4 gap-1 items-center justify-center">
        <InputField
          inputs={[
            {
              placeholder: 'Enter a YouTube link (e.g., https://www.youtube.com/watch?v=xyz)',
              span: 'col-span-4 ',
              width: 'w-[40.875rem]',
              name: 'url',
              type: 'url',
              value: url,
              onChange: handleUrlChange
            },
            {
              placeholder: 'Enter download location (e.g., /Users/yourname/Videos)',
              span: 'col-span-3 ',
              width: 'w-[30.5625rem]',
              name: 'location',
              value: selectedFolder,
              readOnly: true
            }
          ]}
        />
        <Button
          buttonAttributes={[
            {
              buttonWidth: 'w-[9.9375rem] ',
              span: 'col-start-4 col-end-4',
              label: 'Select Location',
              icon: folderIcon,
              iconPosition: '-translate-y-[1px]'
            }
          ]}
          onClick={handleSelectFolder}
        />
      </div>
      <div className="flex justify-center items-center gap-1">
        <h3 className="text-accent-gray text-[0.875rem]">Select Quality: </h3>
        <QualityOptions selectedQuality={selectedQuality} setSelectedQuality={setSelectedQuality} />
      </div>
      <DownloadButton
        url={url}
        selectedFolder={selectedFolder}
        selectedQuality={selectedQuality}
        setDownloading={setDownloading}
      />
    </>
  )
}

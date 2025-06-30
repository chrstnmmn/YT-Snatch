import { useEffect, useState } from 'react'
import QualityOptions from './QualityOption'
import Button from './Button'

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

  const downloadIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
      <path
        d="M18.4648 6.35564C17.9469 6.01546 17.2996 5.7681 16.5867 5.6321C16.4666 5.60834 16.3558 5.54868 16.2682 5.46053C16.1806 5.37237 16.1199 5.25959 16.0938 5.13616C15.7867 3.74357 15.1328 2.54831 14.1738 1.64238C13.0527 0.583104 11.5707 0 10 0C8.61914 0 7.34375 0.447114 6.31367 1.2913C5.61797 1.86431 5.0576 2.59333 4.675 3.42317C4.63244 3.51674 4.56881 3.59843 4.48944 3.6614C4.41006 3.72437 4.31725 3.7668 4.21875 3.78514C3.15898 3.98287 2.24492 4.37752 1.54648 4.94327C0.535156 5.76366 0 6.92301 0 8.29663C0 11.0164 2.18477 12.913 5.3125 12.913H9.375V7.76599C9.375 7.41854 9.63359 7.12033 9.96992 7.10298C10.0544 7.09877 10.1389 7.11234 10.2182 7.14284C10.2974 7.17335 10.3699 7.22017 10.4312 7.28046C10.4924 7.34076 10.5412 7.41327 10.5745 7.4936C10.6078 7.57394 10.625 7.66043 10.625 7.74783V12.913H15.4688C18.3062 12.913 20 11.5313 20 9.21668C20 8.00407 19.4691 7.01461 18.4648 6.35564Z"
        fill="#E5E5E5"
      />
      <path
        d="M9.38336 15.8311L7.9689 14.3749C7.85258 14.2586 7.69656 14.1942 7.53458 14.1956C7.37259 14.197 7.21765 14.2641 7.10323 14.3824C6.98881 14.5006 6.92411 14.6605 6.92311 14.8276C6.92211 14.9946 6.98488 15.1554 7.09788 15.2751L9.5645 17.8143C9.68011 17.9333 9.83673 18 10 18C10.1633 18 10.3199 17.9333 10.4355 17.8143L12.9022 15.2751C13.0152 15.1554 13.0779 14.9946 13.0769 14.8276C13.0759 14.6605 13.0112 14.5006 12.8968 14.3824C12.7824 14.2641 12.6274 14.197 12.4655 14.1956C12.3035 14.1942 12.1475 14.2586 12.0311 14.3749L10.6167 15.8311V12.9131H9.38336V15.8311Z"
        fill="#E5E5E5"
      />
    </svg>
  )

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
        {downloadIcon}
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
    window.api.send('open-directory-dialog')
  }

  const folderIcon = (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 20 16" fill="none">
  <path d="M16.2777 1.33334H9.94164C9.74918 1.33397 9.56089 1.27596 9.40066 1.16667L8.27075 0.392088C7.89659 0.135594 7.45642 -0.000898565 7.00631 4.45186e-06H3.92183C3.31837 0.000666213 2.73982 0.246711 2.31311 0.684153C1.8864 1.12159 1.6464 1.7147 1.64575 2.33334V3.33334H18.5537C18.5537 2.04667 17.5327 1.33334 16.2777 1.33334Z" fill="#E5E5E5"/>
  <path d="M16.9178 16H3.28164C2.68442 15.9993 2.11139 15.758 1.68613 15.3281C1.26088 14.8983 1.01747 14.3143 1.00841 13.7021L0.352412 6.83794V6.82627C0.33093 6.55115 0.365226 6.27445 0.453141 6.01359C0.541057 5.75272 0.680688 5.51333 0.863251 5.31048C1.04581 5.10763 1.26735 4.94571 1.51393 4.83492C1.76051 4.72412 2.02679 4.66684 2.29602 4.66669H17.9074C18.1766 4.66696 18.4428 4.72432 18.6893 4.83517C18.9358 4.94601 19.1572 5.10795 19.3397 5.31079C19.5221 5.51362 19.6617 5.75297 19.7496 6.01378C19.8374 6.27459 19.8717 6.55122 19.8502 6.82627V6.83794L19.191 13.7021C19.1819 14.3143 18.9385 14.8983 18.5133 15.3281C18.088 15.758 17.515 15.9993 16.9178 16Z" fill="#E5E5E5"/>
</svg>)

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

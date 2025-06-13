import downloadIcon from '../assets/download.svg'
import youtubeLogo from '../assets/youtubedownloadlogo.svg'

function Logo() {
  return (
    <img src={youtubeLogo} className="w-[30%] translate-y-2 select-none pointer-events-none drag" />
  )
}

function DownloadButton({ onClick }) {
  const borderStyle = 'w-[12.25rem] h-[2.9rem] linear-gradient animate-pulse shadow-glow py-[1.5rem] px-[.1rem] rounded-full flex justify-center items-center'
  const buttonStyle = 'text-accent-white text-sm font-extrabold w-[15.25rem] h-[2.75rem] bg-button-black border-2 rounded-full flex items-center justify-center gap-1'

  return (
    <div className={borderStyle}>
      <button className={buttonStyle} onClick={onClick}>
        <img src={downloadIcon} alt="Download Icon" />
        Download Again
      </button>
    </div>
  )
}

export default function DownloadComplete({ onReset }) {
  const handleClick = () => {
    console.log('Resetting download state...')
    onReset() // This calls the handleReset function from App.jsx
  }

  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <Logo />
      <h1 className="text-accent-white text-4xl font-black">Download Complete (•‿•)</h1>
      <DownloadButton onClick={handleClick} />
    </div>
  )
}
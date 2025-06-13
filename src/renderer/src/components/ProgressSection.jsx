import { useState, useEffect, useRef } from 'react'
import Button from './Button'
import cancelIcon from '../assets/cancel.svg'
import pauseIcon from '../assets/pause.svg'
import resumeIcon from '../assets/resume.svg'

export default function ProgressSection({ setDownloading, setDownloadComplete }) {
  const [progress, setProgress] = useState({
    filename: '',
    percent: 100, // Start at 100% during merging
     eta: '00:00', // Set to 00:00 during merging
    speed: '0 KiB/s', // Set to 0 during merging
    status: 'waiting',
    fragments: { current: 0, total: 0 },
    isFragmenting: false,
    isMerging: false
  })

  const isActuallyPaused = useRef(false)
  const pauseRequestTime = useRef(0)

  const formatETA = (etaString) => {
    if (!etaString || etaString === 'N/A') return 'N/A'
    if (typeof etaString === 'string' && etaString.includes(':')) return etaString

    const seconds = typeof etaString === 'string' ? parseInt(etaString) : etaString
    if (!isNaN(seconds)) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return 'N/A'
  }

  useEffect(() => {
    const parseNativeProgress = (output) => {
      if (!output) return null
      if (isActuallyPaused.current && Date.now() - pauseRequestTime.current < 2000) return null

      const lines = output.split('\n')
      let update = null
      let fragmentComplete = false
      let isMerging = false

      for (const line of lines) {
        // Check for merging phase start
        if (line.includes('[Merger] Merging formats')) {
          isMerging = true
          return {
            status: 'merging',
            percent: 100,
            eta: '00:00',
            speed: '0 KiB/s',
            isMerging: true,
            isFragmenting: false
          }
        }

        if (line.includes('Download paused')) {
          isActuallyPaused.current = true
          return {
            status: 'paused',
            isFragmenting: false,
            isMerging: false
          }
        }

        if (line.includes('Download resumed')) {
          isActuallyPaused.current = false
          return {
            status: 'downloading',
            isFragmenting: false,
            isMerging: false
          }
        }

        const filenameMatch = line.match(/Destination:\s*(.+)|Download complete:\s*(.+)/)
        if (filenameMatch) {
          const path = filenameMatch[1] || filenameMatch[2]
          if (path) {
            update = {
              ...(update || {}),
              filename: path.split(/[\\/]/).pop().trim()
            }
          }
        }

        if (line.includes('[download] Downloading fragments')) {
          fragmentComplete = false
        } else if (line.includes('[download] Finished downloading fragments')) {
          fragmentComplete = true
        }

        const progressMatch = line.match(
          /\[download\]\s*([\d.]+)%(?:\s+of\s+~?\s*([\d.]+MiB))?(?:\s+at\s+([\d.]+\s*\w+\/s))?(?:\s+ETA\s+([\d:]+|N\/A))?(?:\s*\(frag\s*(\d+)\/(\d+)\))?/
        )

        if (progressMatch) {
          const isFragmenting = !!progressMatch[5] && !!progressMatch[6] && !fragmentComplete
          update = {
            ...(update || {}),
            percent: parseFloat(progressMatch[1]),
            status: 'downloading',
            isFragmenting,
            isMerging: false,
            fragments: {
              current: progressMatch[5] ? parseInt(progressMatch[5]) : 0,
              total: progressMatch[6] ? parseInt(progressMatch[6]) : 0
            }
          }

          if (!isFragmenting && progressMatch[4] && progressMatch[4] !== 'N/A') {
            update.eta = progressMatch[4]
          }

          if (progressMatch[3]) update.speed = progressMatch[3]
        }

        // Completion is detected when original files are deleted
        if (line.includes('Deleting original file')) {
          return {
            ...(update || {}),
            status: 'finished',
            percent: 100,
            eta: '00:00',
            speed: '0 KiB/s',
            isFragmenting: false,
            isMerging: false
          }
        }
      }

      return update
    }

    const handleOutput = (data) => {
      if (!data) return
      const line = typeof data === 'string' ? data : data.data
      const update = parseNativeProgress(line)
      if (!update) return

      setProgress((prev) => {
        if (isActuallyPaused.current && update.status !== 'paused') {
          return prev
        }

        const newState = {
          ...prev,
          ...update,
          status: isActuallyPaused.current ? 'paused' : update.status
        }

        if (newState.status === 'finished') {
          setTimeout(() => {
            setDownloading(false)
            setDownloadComplete(true)
          }, 1000)
        }

        return newState
      })
    }

    const cleanupOutput = window.api?.on('download-output', handleOutput)
    const cleanupPaused = window.api?.on('download-paused-immediate', (_, data) => {
      isActuallyPaused.current = true
      setProgress((prev) => ({
        ...prev,
        status: 'paused',
        isFragmenting: false,
        isMerging: false
      }))
    })
    const cleanupResumed = window.api?.on('download-resumed-immediate', (_, data) => {
      isActuallyPaused.current = false
      setProgress((prev) => ({
        ...prev,
        status: 'downloading',
        isFragmenting: false,
        isMerging: false
      }))
    })

    return () => {
      cleanupOutput?.()
      cleanupPaused?.()
      cleanupResumed?.()
    }
  }, [setDownloading, setDownloadComplete])

  const ProgressBar = () => {
    return (
      <div
        className={`w-[40.8rem] h-[1rem] px-[.1rem] py-[.1rem] rounded-full ${
          progress.status === 'paused' ? 'animate-pulse' : 'linear-gradient'
        } shadow-glow`}
      >
        <div className="w-full h-full rounded-full bg-button-black border-2 border-accent-gray overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progress.status === 'paused' ? 'bg-accent-gray' : 'bg-accent-white'
            }`}
            style={{
              width: `${Math.min(100, Math.max(0, progress.percent))}%`,
              transitionProperty: 'width',
              transitionTimingFunction: 'linear',
              transitionDuration: '100ms'
            }}
          />
        </div>
      </div>
    )
  }

  const DownloadLabel = () => (
    <div>
      <ul className="w-[40.8rem] text-accent-white text-[10px] font-normal text-nowrap flex items-center gap-2">
        <li className="w-[32.5rem] overflow-hidden text-ellipsis whitespace-nowrap pr-[8rem]">
          {progress.status === 'merging'
            ? 'Merging files please wait...'
            : progress.filename
              ? `${progress.status === 'paused' ? 'Download Paused: ' : 'Now Downloading: '}${progress.filename}`
              : 'Preparing download...'}
        </li>
        <li>
          {progress.status === 'merging'
            ? 'ETA: 00:00'
            : progress.status === 'paused'
              ? `ETA(PAUSED): ${formatETA(progress.eta)}`
              : progress.isFragmenting
                ? `Fragments: ${progress.fragments.current}/${progress.fragments.total}`
                : `ETA: ${formatETA(progress.eta)}`}
        </li>
        <li>{`Progress: ${progress.percent.toFixed(1)}%`}</li>
      </ul>
    </div>
  )

  const StateButton = () => {
    // Hide buttons during fragmentation, merging, or when preparing download
    if (progress.isFragmenting || progress.status === 'merging' || progress.status === 'waiting') {
      return null
    }

    const handlePauseResume = () => {
      if (progress.status === 'paused') {
        isActuallyPaused.current = false
        setProgress((prev) => ({ ...prev, status: 'downloading' }))
        window.api.send('resume-download')
      } else {
        isActuallyPaused.current = true
        pauseRequestTime.current = Date.now()
        setProgress((prev) => ({ ...prev, status: 'paused' }))
        window.api.send('pause-download')
      }
    }

    return (
      <div className="flex flex-row gap-1 pt-3">
        <Button
          buttonAttributes={[
            {
              buttonWidth: 'w-[5.75rem]',
              label: 'Cancel',
              icon: cancelIcon
            }
          ]}
          onClick={() => {
            window.api.send('cancel-download')
            setDownloading(false)
          }}
        />
        <Button
          buttonAttributes={[
            {
              buttonWidth: progress.status === 'paused' ? 'w-[6.0625rem]' : 'w-[5.5rem]',
              label: progress.status === 'paused' ? 'Resume' : 'Pause',
              icon: progress.status === 'paused' ? resumeIcon : pauseIcon // Fixed: Changed cancelIcon to pauseIcon
            }
          ]}
          onClick={handlePauseResume}
          disabled={progress.status === 'finished' || progress.status === 'error'}
        />
      </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center">
      <DownloadLabel />
      <ProgressBar />
      <StateButton />
    </div>
  )
}

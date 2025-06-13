import { useState, useEffect } from 'react'

const qualityLists = [
  { qualityLabel: '360p', value: 'low' },
  { qualityLabel: '720p', value: 'medium' },
  { qualityLabel: '1080p', value: 'high' },
  { qualityLabel: '4K', value: 'highest' }
]

function QualityOptButton({ qualityLabel, isActive, value, onClick }) {
  const buttonClassName = isActive
    ? 'text-button-black bg-accent-white font-extrabold text-[.75rem] border-2 border-accent-white px-3 py-[.2rem] border rounded-3xl'
    : 'text-accent-white bg-button-black font-extrabold text-[.75rem] px-3 py-[.2rem] border-2 border-accent-gray rounded-3xl'

  return (
    <button className={buttonClassName} onClick={() => onClick(value)}>
      {qualityLabel}
    </button>
  )
}

export default function QualityOptions({ selectedQuality, setSelectedQuality }) {
  const [selectedValue, setSelectedValue] = useState(null)

  useEffect(() => {
    console.log('Selected quality:', selectedValue)
  }, [selectedValue])

  const handleClick = (value) => {
    const newValue = value === selectedQuality ? null : value
    setSelectedQuality(newValue)
    setSelectedValue(newValue)
  }

  return (
    <>
      {qualityLists.map((options, index) => (
        <div key={index}>
          <QualityOptButton
            qualityLabel={options.qualityLabel}
            isActive={options.value === selectedQuality}
            value={options.value}
            onClick={handleClick}
          />
        </div>
      ))}
    </>
  )
}

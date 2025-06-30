// Icons component
function Icons({ icon, iconPosition }) {
  return typeof icon === 'string' ? (
    <img src={icon} className={iconPosition} alt="icon" />
  ) : (
    <span className={iconPosition}>{icon}</span>
  )
}

// Button component
export default function Button({ buttonAttributes, onClick, type = 'button' }) {
  const defaultButtonStyle =
    'h-[36px] text-accent-white font-bold text-[0.875rem] bg-button-black border-2 rounded-3xl border-accent-gray flex justify-center items-center gap-1'

  return (
    <>
      {buttonAttributes.map((button, index) => (
        <button
          key={index}
          className={`${button.buttonWidth || ''} ${button.span || ''} ${defaultButtonStyle}`.trim()}
          onClick={onClick}
          type={type} // Ensure the type prop is passed
        >
          {button.icon && <Icons icon={button.icon} iconPosition={button.iconPosition} />}
          {button.label}
        </button>
      ))}
    </>
  )
}

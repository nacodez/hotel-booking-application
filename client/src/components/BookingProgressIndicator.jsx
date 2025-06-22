const BookingProgressIndicator = ({ currentStep = 1 }) => {
  const steps = [
    { id: 1, label: 'Search', completed: currentStep > 1, active: currentStep === 1 },
    { id: 2, label: 'Select Room', completed: currentStep > 2, active: currentStep === 2 },
    { id: 3, label: 'Contact Information', completed: currentStep > 3, active: currentStep === 3 },
    { id: 4, label: 'Confirmation', completed: currentStep > 4, active: currentStep === 4 }
  ]

  return (
    <div className="booking-progress-container">
      <div className="booking-progress">
        {steps.map((step, index) => (
          <div key={step.id} className="progress-step-wrapper">
            <div className="progress-step-container">
              <div className={`progress-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}>
                {step.completed ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                ) : (
                  <span className="step-number">{step.id}</span>
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BookingProgressIndicator
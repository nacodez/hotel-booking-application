import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const EnhancedAuthPage = () => {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [selectedRole, setSelectedRole] = useState('user')
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [authError, setAuthError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const [formData, setFormData] = useState({
    // Basic fields
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    // Hotel owner business fields
    businessInfo: {
      businessName: '',
      businessType: '',
      businessAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      businessPhone: '',
      businessEmail: '',
      businessRegistrationNumber: '',
      taxId: '',
      website: '',
      description: ''
    }
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('businessInfo.')) {
      const field = name.replace('businessInfo.', '')
      if (field.startsWith('businessAddress.')) {
        const addressField = field.replace('businessAddress.', '')
        setFormData(prev => ({
          ...prev,
          businessInfo: {
            ...prev.businessInfo,
            businessAddress: {
              ...prev.businessInfo.businessAddress,
              [addressField]: value
            }
          }
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          businessInfo: {
            ...prev.businessInfo,
            [field]: value
          }
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleRoleChange = (role) => {
    setSelectedRole(role)
    setAuthError('')
    setSuccessMessage('')
  }

  const validateForm = () => {
    // Basic validation
    if (!formData.email || !formData.password) {
      setAuthError('Email and password are required')
      return false
    }

    if (!isLoginMode) {
      if (!formData.firstName || !formData.lastName) {
        setAuthError('First name and last name are required')
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        setAuthError('Passwords do not match')
        return false
      }

      if (formData.password.length < 8) {
        setAuthError('Password must be at least 8 characters long')
        return false
      }

      // Hotel owner specific validation
      if (selectedRole === 'hotel-owner') {
        const { businessInfo } = formData
        if (!businessInfo.businessName) {
          setAuthError('Business name is required for hotel owners')
          return false
        }
        if (!businessInfo.businessType) {
          setAuthError('Business type is required for hotel owners')
          return false
        }
        if (!businessInfo.businessAddress.street || !businessInfo.businessAddress.city || !businessInfo.businessAddress.country) {
          setAuthError('Complete business address is required for hotel owners')
          return false
        }
        if (!businessInfo.businessPhone) {
          setAuthError('Business phone number is required for hotel owners')
          return false
        }
        if (!businessInfo.businessEmail) {
          setAuthError('Business email is required for hotel owners')
          return false
        }
      }
    }

    return true
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    try {
      setIsProcessingAuth(true)
      
      if (isLoginMode) {
        await login(formData.email, formData.password)
        navigate('/')
      } else {
        const userData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
          phoneNumber: formData.phoneNumber || null
        }

        // Add business info for hotel owners
        if (selectedRole === 'hotel-owner') {
          userData.businessInfo = formData.businessInfo
        }

        const result = await register(userData)
        
        if (result.requiresApproval) {
          setSuccessMessage(
            'Hotel owner registration submitted successfully! Your account will be reviewed by our team and you will be notified once approved.'
          )
          // Reset form
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
            businessInfo: {
              businessName: '',
              businessType: '',
              businessAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
              businessPhone: '',
              businessEmail: '',
              businessRegistrationNumber: '',
              taxId: '',
              website: '',
              description: ''
            }
          })
        } else {
          navigate('/')
        }
      }
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setIsProcessingAuth(false)
    }
  }

  const toggleAuthMode = () => {
    setIsLoginMode(!isLoginMode)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      businessInfo: {
        businessName: '',
        businessType: '',
        businessAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
        businessPhone: '',
        businessEmail: '',
        businessRegistrationNumber: '',
        taxId: '',
        website: '',
        description: ''
      }
    })
    setAuthError('')
    setSuccessMessage('')
    setSelectedRole('user')
  }

  return (
    <div className="container">
      <div className="auth-container">
        <div className="auth-form card">
          <h1>{isLoginMode ? 'Sign In' : 'Create Account'}</h1>
          
          {authError && (
            <div className="alert alert-error">
              {authError}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          {/* Role Selection for Registration */}
          {!isLoginMode && !successMessage && (
            <div className="role-selection">
              <h3>Choose Your Account Type</h3>
              <div className="role-options">
                <div 
                  className={`role-option ${selectedRole === 'user' ? 'selected' : ''}`}
                  onClick={() => handleRoleChange('user')}
                >
                  <div className="role-icon">👤</div>
                  <div className="role-info">
                    <h4>Guest User</h4>
                    <p>Browse and book hotel rooms</p>
                  </div>
                </div>
                <div 
                  className={`role-option ${selectedRole === 'hotel-owner' ? 'selected' : ''}`}
                  onClick={() => handleRoleChange('hotel-owner')}
                >
                  <div className="role-icon">🏨</div>
                  <div className="role-info">
                    <h4>Hotel Owner</h4>
                    <p>Manage hotels and rooms (requires approval)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            {/* Basic Registration Fields */}
            {!isLoginMode && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            {!isLoginMode && (
              <>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Hotel Owner Business Information */}
                {selectedRole === 'hotel-owner' && (
                  <div className="business-info-section">
                    <h3>Business Information</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Business Name *</label>
                      <input
                        type="text"
                        name="businessInfo.businessName"
                        value={formData.businessInfo.businessName}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Business Type *</label>
                      <select
                        name="businessInfo.businessType"
                        value={formData.businessInfo.businessType}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      >
                        <option value="">Select Business Type</option>
                        <option value="hotel">Hotel</option>
                        <option value="resort">Resort</option>
                        <option value="motel">Motel</option>
                        <option value="inn">Inn</option>
                        <option value="b&b">Bed & Breakfast</option>
                        <option value="apartment">Apartment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Business Address *</label>
                      <input
                        type="text"
                        name="businessInfo.businessAddress.street"
                        value={formData.businessInfo.businessAddress.street}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Street Address"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <input
                          type="text"
                          name="businessInfo.businessAddress.city"
                          value={formData.businessInfo.businessAddress.city}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="City *"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="text"
                          name="businessInfo.businessAddress.state"
                          value={formData.businessInfo.businessAddress.state}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="State/Province"
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="text"
                          name="businessInfo.businessAddress.zipCode"
                          value={formData.businessInfo.businessAddress.zipCode}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="ZIP Code"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <input
                        type="text"
                        name="businessInfo.businessAddress.country"
                        value={formData.businessInfo.businessAddress.country}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Country *"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Business Phone *</label>
                        <input
                          type="tel"
                          name="businessInfo.businessPhone"
                          value={formData.businessInfo.businessPhone}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Business Email *</label>
                        <input
                          type="email"
                          name="businessInfo.businessEmail"
                          value={formData.businessInfo.businessEmail}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Business Registration Number</label>
                        <input
                          type="text"
                          name="businessInfo.businessRegistrationNumber"
                          value={formData.businessInfo.businessRegistrationNumber}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tax ID</label>
                        <input
                          type="text"
                          name="businessInfo.taxId"
                          value={formData.businessInfo.taxId}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Website</label>
                      <input
                        type="url"
                        name="businessInfo.website"
                        value={formData.businessInfo.website}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="https://www.yourbusiness.com"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Business Description</label>
                      <textarea
                        name="businessInfo.description"
                        value={formData.businessInfo.description}
                        onChange={handleInputChange}
                        className="form-input"
                        rows="3"
                        placeholder="Brief description of your business..."
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isProcessingAuth}
            >
              {isProcessingAuth ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {!successMessage && (
            <div className="auth-toggle">
              <p>
                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button"
                  onClick={toggleAuthMode}
                  className="btn btn-secondary btn-sm"
                >
                  {isLoginMode ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedAuthPage
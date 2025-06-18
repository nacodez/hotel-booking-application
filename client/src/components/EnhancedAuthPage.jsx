import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const EnhancedAuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedRole, setSelectedRole] = useState('user')
  
  const { login, register } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'user',
    businessInfo: {
      businessName: '',
      businessType: '',
      businessAddress: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: ''
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
    
    if (name.startsWith('business.')) {
      const field = name.split('.')[1]
      if (field.startsWith('address.')) {
        const addressField = field.split('.')[1]
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
    setFormData(prev => ({
      ...prev,
      role: role
    }))
  }

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields')
      return false
    }
    
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (!isLogin && password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    
    // Validate business info for hotel owners
    if (!isLogin && selectedRole === 'hotel-owner') {
      const { businessName, businessType, businessPhone, businessEmail } = formData.businessInfo
      if (!businessName.trim() || !businessType || !businessPhone.trim() || !businessEmail.trim()) {
        setError('Please fill in all required business information')
        return false
      }
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        setSuccess('Login successful!')
      } else {
        const result = await register(formData)
        
        if (result.requiresApproval) {
          setSuccess('Registration submitted successfully! Your hotel owner account will be reviewed and you will be notified once approved.')
        } else {
          setSuccess('Registration successful!')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderRoleSelector = () => (
    <div className="role-selector">
      <label className="form-label">Account Type</label>
      <div className="role-options">
        <div 
          className={`role-option ${selectedRole === 'user' ? 'selected' : ''}`}
          onClick={() => handleRoleChange('user')}
        >
          <div className="role-icon">👤</div>
          <h3>Guest</h3>
          <p>Book rooms and manage reservations</p>
        </div>
        
        <div 
          className={`role-option ${selectedRole === 'hotel-owner' ? 'selected' : ''}`}
          onClick={() => handleRoleChange('hotel-owner')}
        >
          <div className="role-icon">🏨</div>
          <h3>Hotel Owner</h3>
          <p>List and manage your hotel properties</p>
          <small>Requires approval</small>
        </div>
      </div>
    </div>
  )

  const renderBusinessInfoForm = () => {
    if (selectedRole !== 'hotel-owner') return null
    
    return (
      <div className="business-info-section">
        <h3>Business Information</h3>
        <p className="text-sm text-gray-600 mb-4">
          This information will be reviewed by our team before approval.
        </p>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="businessName">Business Name *</label>
            <input
              type="text"
              id="businessName"
              name="business.businessName"
              value={formData.businessInfo.businessName}
              onChange={handleInputChange}
              required
              placeholder="Your Hotel/Business Name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="businessType">Business Type *</label>
            <select
              id="businessType"
              name="business.businessType"
              value={formData.businessInfo.businessType}
              onChange={handleInputChange}
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
        </div>
        
        <div className="form-group">
          <label htmlFor="businessDescription">Business Description</label>
          <textarea
            id="businessDescription"
            name="business.description"
            value={formData.businessInfo.description}
            onChange={handleInputChange}
            rows="3"
            placeholder="Brief description of your business..."
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="businessPhone">Business Phone *</label>
            <input
              type="tel"
              id="businessPhone"
              name="business.businessPhone"
              value={formData.businessInfo.businessPhone}
              onChange={handleInputChange}
              required
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="businessEmail">Business Email *</label>
            <input
              type="email"
              id="businessEmail"
              name="business.businessEmail"
              value={formData.businessInfo.businessEmail}
              onChange={handleInputChange}
              required
              placeholder="business@example.com"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="businessRegistrationNumber">Business Registration Number</label>
            <input
              type="text"
              id="businessRegistrationNumber"
              name="business.businessRegistrationNumber"
              value={formData.businessInfo.businessRegistrationNumber}
              onChange={handleInputChange}
              placeholder="Registration/License Number"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="taxId">Tax ID</label>
            <input
              type="text"
              id="taxId"
              name="business.taxId"
              value={formData.businessInfo.taxId}
              onChange={handleInputChange}
              placeholder="Tax Identification Number"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="website">Website</label>
          <input
            type="url"
            id="website"
            name="business.website"
            value={formData.businessInfo.website}
            onChange={handleInputChange}
            placeholder="https://www.yourhotel.com"
          />
        </div>
        
        <h4>Business Address</h4>
        <div className="form-group">
          <label htmlFor="businessStreet">Street Address</label>
          <input
            type="text"
            id="businessStreet"
            name="business.address.street"
            value={formData.businessInfo.businessAddress.street}
            onChange={handleInputChange}
            placeholder="123 Main Street"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="businessCity">City</label>
            <input
              type="text"
              id="businessCity"
              name="business.address.city"
              value={formData.businessInfo.businessAddress.city}
              onChange={handleInputChange}
              placeholder="City"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="businessState">State/Province</label>
            <input
              type="text"
              id="businessState"
              name="business.address.state"
              value={formData.businessInfo.businessAddress.state}
              onChange={handleInputChange}
              placeholder="State/Province"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="businessCountry">Country</label>
            <input
              type="text"
              id="businessCountry"
              name="business.address.country"
              value={formData.businessInfo.businessAddress.country}
              onChange={handleInputChange}
              placeholder="Country"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="businessPostalCode">Postal Code</label>
            <input
              type="text"
              id="businessPostalCode"
              name="business.address.postalCode"
              value={formData.businessInfo.businessAddress.postalCode}
              onChange={handleInputChange}
              placeholder="12345"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-container">
          <div className="auth-header">
            <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p>
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Join our platform to start your journey'
              }
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && renderRoleSelector()}
            
            {!isLogin && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="John"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="john@example.com"
              />
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
              />
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>
            )}
            
            {!isLogin && renderBusinessInfoForm()}
            
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-toggle">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setSuccess('')
                  setSelectedRole('user')
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    phoneNumber: '',
                    role: 'user',
                    businessInfo: {
                      businessName: '',
                      businessType: '',
                      businessAddress: {
                        street: '',
                        city: '',
                        state: '',
                        country: '',
                        postalCode: ''
                      },
                      businessPhone: '',
                      businessEmail: '',
                      businessRegistrationNumber: '',
                      taxId: '',
                      website: '',
                      description: ''
                    }
                  })
                }}
                className="toggle-btn"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedAuthPage
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Mail, Lock, User, Phone, Building, BookmarkCheck, MapPin, CreditCard } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const Register = () => {
  const { register: registerUser } = useAuth()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    const result = await registerUser(data)
    
    if (!result.success && result.errors) {
      Object.keys(result.errors).forEach(key => {
        toast.error(result.errors[key])
      })
    }
    
    setIsLoading(false)
  }

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl shadow-lg shadow-primary/30 mb-6">
            <BookmarkCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Register your library with FeeTrack</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  s <= step ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 transition-all rounded-full ${
                    s < step ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span className={step >= 1 ? 'text-primary font-semibold' : 'text-gray-500'}>Personal</span>
            <span className={step >= 2 ? 'text-primary font-semibold' : 'text-gray-500'}>Library</span>
            <span className={step >= 3 ? 'text-primary font-semibold' : 'text-gray-500'}>Subscription</span>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4 slide-in">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <input
                      type="text"
                      {...register('fullName', { required: 'Full name is required' })}
                      className="input pl-10"
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="input pl-10"
                      placeholder="john@library.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <input
                      type="tel"
                      {...register('phone', { 
                        required: 'Phone is required',
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Phone must be 10 digits'
                        }
                      })}
                      className="input pl-10"
                      placeholder="9876543210"
                    />
                  </div>
                  {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <input
                      type="password"
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                      className="input pl-10"
                      placeholder="Min 8 characters"
                    />
                  </div>
                  {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <input
                      type="password"
                      {...register('confirmPassword', { 
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      className="input pl-10"
                      placeholder="Re-enter password"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Library Info */}
            {step === 2 && (
              <div className="space-y-4 slide-in">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Library Information</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Library Name *</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <input
                      type="text"
                      {...register('libraryName', { required: 'Library name is required' })}
                      className="input pl-10"
                      placeholder="City Central Library"
                    />
                  </div>
                  {errors.libraryName && <p className="text-red-600 text-sm mt-1">{errors.libraryName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Library Code *</label>
                  <input
                    type="text"
                    {...register('libraryCode', { required: 'Library code is required' })}
                    className="input"
                    placeholder="CCL001"
                  />
                  {errors.libraryCode && <p className="text-red-600 text-sm mt-1">{errors.libraryCode.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Library Type *</label>
                  <select {...register('libraryType')} className="input">
                    <option value="public">Public Library</option>
                    <option value="private">Private Library</option>
                    <option value="academic">Academic Library</option>
                    <option value="reading_room">Reading Room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-primary" />
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className="input pl-10 min-h-[80px]"
                      placeholder="123 Main Street"
                    />
                  </div>
                  {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      {...register('city', { required: 'City is required' })}
                      className="input"
                      placeholder="New York"
                    />
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      {...register('state', { required: 'State is required' })}
                      className="input"
                      placeholder="NY"
                    />
                    {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code *</label>
                    <input
                      type="text"
                      {...register('zipCode', { required: 'ZIP code is required' })}
                      className="input"
                      placeholder="10001"
                    />
                    {errors.zipCode && <p className="text-red-600 text-sm mt-1">{errors.zipCode.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                    <input
                      type="text"
                      {...register('country', { required: 'Country is required' })}
                      className="input"
                      placeholder="USA"
                    />
                    {errors.country && <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Subscription */}
            {step === 3 && (
              <div className="space-y-4 slide-in">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Subscription Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subscription Plan *</label>
                  <select {...register('subscriptionPlan')} className="input">
                    <option value="1">Basic Plan - ₹5,000/month</option>
                    <option value="2">Standard Plan - ₹10,000/month</option>
                    <option value="3">Premium Plan - ₹15,000/month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Seat Limit *</label>
                  <input
                    type="number"
                    {...register('seatLimit', { required: 'Seat limit is required', min: 1 })}
                    className="input"
                    placeholder="50"
                  />
                  {errors.seatLimit && <p className="text-red-600 text-sm mt-1">{errors.seatLimit.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">GSTIN (Optional)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <input
                      type="text"
                      {...register('gstin')}
                      className="input pl-10"
                      placeholder="27AAPFH5055F1ZJ"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Number (Optional)</label>
                  <input
                    type="text"
                    {...register('panNumber')}
                    className="input"
                    placeholder="AAAPA5055F"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can start with a free trial for 14 days. No payment required now.
                  </p>
                </div>

                <div className="mt-6">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      {...register('agreeTerms', { required: 'You must agree to the terms and conditions' })}
                      className="mt-1 mr-3 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the <a href="#" className="text-primary font-semibold hover:underline">Terms and Conditions</a> and <a href="#" className="text-primary font-semibold hover:underline">Privacy Policy</a> *
                    </span>
                  </label>
                  {errors.agreeTerms && <p className="text-red-600 text-sm mt-1">{errors.agreeTerms.message}</p>}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary flex-1"
                >
                  Previous
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary flex-1"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="spinner mr-2"></span>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:text-primary-dark">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

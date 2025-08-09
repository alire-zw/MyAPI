'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const showError = (message: string) => {
    setError(message);
    setSuccess('');
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError('');
  };

  const hideMessages = () => {
    setError('');
    setSuccess('');
    setIsSuccess(false);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    hideMessages();
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hideMessages();

    if (!username.trim() || !password.trim()) {
      showError('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    if (password.length < 6) {
      showError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLoginMode ? '/api/users/login' : '/api/users/register';
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: username.trim(),
          userPassword: password.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (isLoginMode) {
          setIsSuccess(true);
          if (data.token) {
            try {
              localStorage.setItem('authToken', data.token);
            } catch {}
            // Set auth cookie for middleware guard (1 day)
            document.cookie = `authToken=${data.token}; Max-Age=86400; Path=/; SameSite=Lax`;
          }
          // Robust redirect (no delay). replace() prevents back to login on back button
          try {
            window.location.replace('/dashboard');
          } catch {
            window.location.href = '/dashboard';
          }
          return;
        } else {
          showSuccess('ثبت نام موفقیت‌آمیز بود. اکنون می‌توانید وارد شوید');
          setTimeout(() => {
            setIsLoginMode(true);
            setPassword('');
          }, 800);
        }
      } else {
        showError(data.message || 'خطایی رخ داده است');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white h-screen flex items-start sm:items-center justify-center overflow-hidden pt-24 sm:pt-0">
      <div className="w-full max-w-md p-10 px-4 sm:px-10">
        <div className="text-right mb-8">
          <p className="text-sm font-normal text-gray-600 mb-1">
            {isLoginMode ? 'برای دسترسی به وب سرویس‌ها' : 'برای عضویت در پلتفرم API میرال'}
          </p>
          <h1 className="text-3xl font-bold text-gray-800">
            {isLoginMode ? 'وارد شوید!' : 'ثبت نام کنید!'}
          </h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              نام کاربری
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow English letters, numbers, and common symbols
                const englishOnly = value.replace(/[^a-zA-Z0-9@._-]/g, '');
                setUsername(englishOnly);
                hideMessages();
              }}
              className={`w-full px-4 py-2 border rounded-xl text-base transition-colors focus:outline-none focus:ring-1 focus:ring-black focus:ring-opacity-20 text-center placeholder-gray-400 text-black ${
                isSuccess 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 focus:border-black'
              }`}
              placeholder="نام کاربری خود را وارد کنید"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              رمز عبور
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                hideMessages();
              }}
              className={`w-full px-4 py-2 border rounded-xl text-base transition-colors focus:outline-none focus:ring-1 focus:ring-black focus:ring-opacity-20 text-center placeholder-gray-400 text-black ${
                isSuccess 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 focus:border-black'
              }`}
              placeholder="رمز عبور خود را وارد کنید"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed mt-2 ${
              isSuccess 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-black hover:bg-gray-900 disabled:bg-gray-400 text-white'
            }`}
          >
            {loading ? 'در حال پردازش...' : (isLoginMode ? 'ورود' : 'ثبت نام')}
          </button>
          
          {loading && (
            <div className="text-center text-sm text-gray-600 mt-3">
              در حال بررسی اطلاعات...
            </div>
          )}
        </form>
        
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={toggleMode}
            className="text-gray-800 hover:text-black font-medium text-sm cursor-pointer"
          >
            {isLoginMode ? (
              <>
                <span className="text-gray-800">حساب کاربری ندارید؟ </span>
                <span className="text-blue-600 hover:text-blue-800">ثبت نام کنید</span>
              </>
            ) : (
              <>
                <span className="text-gray-800">حساب کاربری دارید؟ </span>
                <span className="text-blue-600 hover:text-blue-800">وارد شوید</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
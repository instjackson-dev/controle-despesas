// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost'
}

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
}

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

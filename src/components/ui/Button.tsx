import { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantCls: Record<Variant, string> = {
  primary:   'bg-gold-400 hover:bg-gold-300 text-navy-950 font-semibold',
  secondary: 'bg-navy-700 hover:bg-navy-600 text-white border border-navy-600',
  ghost:     'bg-transparent hover:bg-navy-800 text-zinc-300',
  danger:    'bg-red-700 hover:bg-red-600 text-white',
}

const sizeCls: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 rounded-lg transition-colors ${variantCls[variant]} ${sizeCls[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

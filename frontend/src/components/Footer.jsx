import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const links = [
  { label: 'About', href: '#' }, { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' }, { label: 'Help', href: '#' },
  { label: 'Careers', href: '#' }, { label: 'Blog', href: '#' },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800
                       bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <Link to="/feed" className="flex items-center gap-2 no-underline group">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center
                            shadow-glow transition-transform duration-300 group-hover:scale-110">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Connecto</span>
          </Link>
          <p className="text-slate-500 text-sm text-center">
            Connect, share, and grow with the world around you.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {links.map((l) => (
            <a key={l.label} href={l.href}
              className="text-xs text-slate-500 hover:text-blue-500 dark:hover:text-blue-400
                         transition-colors duration-200 no-underline">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2
                        pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} Connecto. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {['📘', '📸', '💼'].map((icon, i) => (
              <button key={i}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm
                           bg-slate-100 dark:bg-slate-800
                           text-slate-600 dark:text-slate-400
                           hover:bg-slate-200 dark:hover:bg-slate-700
                           hover:scale-110 transition-all duration-200">
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

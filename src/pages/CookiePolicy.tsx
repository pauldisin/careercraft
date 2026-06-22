import React from 'react';
import SEO from '../components/SEO';
import { Settings, Shield, Info, ArrowRight } from 'lucide-react';

export default function CookiePolicy() {
  const triggerPreferenceCenter = (e: React.MouseEvent) => {
    e.preventDefault();
    const event = new Event('open-cookie-settings');
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Cookie & Web Storage Preferences Policy | CareerCraft" 
        description="Configure your cookie preferences and explore how CareerCraft uses local storage and tracking technologies to power live AI formatting previews." 
      />
      <div className="max-w-4xl mx-auto prose dark:prose-invert">
        <h1 className="font-serif text-4xl mb-2 text-slate-900 dark:text-white">Cookie & Web Storage Policy</h1>
        <p className="text-sm italic text-slate-500 mb-8">Last updated: May 30, 2026</p>
        
        <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-lg mb-8">
          <p className="text-amber-800 dark:text-amber-300 text-sm m-0">
            <strong>Legal Notice:</strong> This policy outlines how CareerCraft utilizes both traditional browser cookies and modern web local storage technologies. We believe in complete transparency and empower you with modular controls to adjust your settings at any time.
          </p>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-0 mb-1">Interactive Preference Center</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
              Would you like to review or opt-in/opt-out of non-essential analytics tracking right now? Use our self-service widget directly.
            </p>
          </div>
          <button
            onClick={triggerPreferenceCenter}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm shrink-0"
          >
            <Settings className="w-4 h-4" />
            Open Cookie Manager
          </button>
        </div>

        <h2>1. What are Cookies & Web Storage?</h2>
        <p>
          While traditional <strong>Cookies</strong> are small text files sent by a server to be stored on your browser, modern applications like CareerCraft also use <strong>Web Local Storage (localStorage & sessionStorage)</strong>. Web Storage acts as a secure, fast, and light storage vault inside your browser, allowing us to keep you securely signed in and cache your draft changes without sending tracking headers on every asset query.
        </p>

        <h2>2. How We Differentiate and Use These Technologies</h2>
        <p>Our workspace employs two distinct tiers of storage depending on whether you are editing offline, paying for verification, or viewing guides:</p>
        <ul>
          <li>
            <strong>Essential local storage (Stripe, Session):</strong> Necessary to validate your sign-in, persist premium active workspace modules, and complete manual subscription upgrading records smoothly. Because these items are required to establish functional platform structures, they are permanently active.
          </li>
          <li>
            <strong>Analytics & Optimization (Google Analytics):</strong> If you grant explicit consent, Google Analytics scripts gather anonymous session and interaction telemetry. No private raw text, credentials, or personal resume details are ever processed or transmitted to analytics databases.
          </li>
        </ul>

        <h2>3. Database of Stored Cookies & Storage Keys</h2>
        <p>The following table lists the specific browser cookies and local storage keys CareerCraft uses, along with their distinct purposes and exact duration terms:</p>

        <div className="overflow-x-auto my-6 border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm m-0">
            <thead className="bg-slate-100 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-900 dark:text-white">Identifier Key</th>
                <th className="px-4 py-3 font-medium text-slate-900 dark:text-white">Storage Tech</th>
                <th className="px-4 py-3 font-medium text-slate-900 dark:text-white">Source / Domain</th>
                <th className="px-4 py-3 font-medium text-slate-900 dark:text-white">Operational Role</th>
                <th className="px-4 py-3 font-medium text-slate-900 dark:text-white">Retention Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">auth_token</td>
                <td className="px-4 py-3">localStorage</td>
                <td className="px-4 py-3">CareerCraft (Internal)</td>
                <td className="px-4 py-3 text-xs">Authenticates the current user session and links workspace tasks.</td>
                <td className="px-4 py-3 text-xs">Persistent (until manually signed out)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">cc_cookie_consent</td>
                <td className="px-4 py-3">localStorage</td>
                <td className="px-4 py-3">CareerCraft (Internal)</td>
                <td className="px-4 py-3 text-xs">Caches your explicit cookie consent states (<code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">granted</code> or <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">denied</code>).</td>
                <td className="px-4 py-3 text-xs">12 Months</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">theme</td>
                <td className="px-4 py-3">localStorage</td>
                <td className="px-4 py-3">CareerCraft (Internal)</td>
                <td className="px-4 py-3 text-xs">Persists your selection of Light Mode vs. Dark Mode.</td>
                <td className="px-4 py-3 text-xs">Persistent</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">_ga / _gid</td>
                <td className="px-4 py-3">Cookie</td>
                <td className="px-4 py-3">Google (Google Analytics)</td>
                <td className="px-4 py-3 text-xs">Distinguishes anonymous visitors, tracks interaction flows, and gauges templates visits. No personal details.</td>
                <td className="px-4 py-3 text-xs">2 Years (Only loaded on active consent)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">__stripe_sid / __stripe_mid</td>
                <td className="px-4 py-3">Cookie / Storage</td>
                <td className="px-4 py-3">Stripe (Payment Processor)</td>
                <td className="px-4 py-3 text-xs">Secures payment processing, detects browser fraud, and identifies valid clients on standard checkouts.</td>
                <td className="px-4 py-3 text-xs">Session to 1 Year (Essential)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>4. Manage Your Settings Separately</h2>
        <p>In addition to using our interactive Cookie Manager widget above, you can completely purge or adjust trackers using browser tools:</p>
        <ul>
          <li>
            <strong>Browser Panel Controls:</strong> You can configure your browser to refuse cookies, alert you when cookies are sent, or automatically wipe localStorage on exit. Consult your browser’s documentation (e.g., Safari, Chrome, Edge, or Firefox settings) for guidance.
          </li>
          <li>
            <strong>Opt-Out Extensions:</strong> You can install the <em>Google Analytics Opt-out Browser Add-on</em> if you prefer to automatically block Google Analytics scripts across all sites globally.
          </li>
        </ul>

        <h2>5. Inquiries & Contact</h2>
        <p>
          If you have concerns about our cookie policy, data isolation zones, or external script integrations, feel free to email our engineering desk at{' '}
          <a href="mailto:support@careercraft.example" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            support@careercraft.example
          </a>. We will reply to you as quickly as possible.
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Privacy Policy & GDPR/CCPA Compliance | CareerCraft" 
        description="Learn how CareerCraft collects, processes, and safeguards your personal data under GDPR, CCPA, and regional digital privacy regulations." 
      />
      <div className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1 className="font-serif text-4xl mb-8">Privacy Policy</h1>
        <p className="text-sm italic text-slate-500">Last updated: April 22, 2026</p>
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/30 p-5 rounded-2xl mb-8">
          <p className="text-xs text-indigo-905 dark:text-indigo-300 leading-relaxed m-0">
            <strong>🔒 Verified Policy Notice & Legal Commitment:</strong> This document represents the legally binding Privacy Policy governing all services, applications, and AI engines operated by CareerCraft. This policy has been fully audited to ensure strict compliance with global data protection standards (including the General Data Protection Regulation - <strong>GDPR</strong> and the California Consumer Privacy Act - <strong>CCPA</strong>), alongside local frameworks within Papua New Guinea, including the <em>Digital Transactions Act 2020</em> and the <em>Cybercrime Code Act 2016</em>.
          </p>
        </div>
        
        <h2>1. Introduction</h2>
        <p>Your privacy is of utmost importance to CareerCraft. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered resume builder and related services.</p>

        <h2>2. Data Collection & Processing Scope</h2>
        <p>CareerCraft limits the collection of personal information only to details required for the secure provision of our specialized resume building, cover letter compiling, and AI analytical features.</p>
        
        <h3>a. User-Provided Career Records</h3>
        <p>We store information you enter directly during resume curation and customization: full name, physical/mailing addresses, phone values, professional profile briefs, employment histories, academic qualifications, acquired skills, and target career interests.</p>
        
        <h3>b. Digital & Manual Local Payment Data</h3>
        <p>To support global accessibility, we operate both automated credit card gateways and regional manual payment channels. Your transaction footprints are handled as follows:</p>
        <ul>
          <li><strong>Digital Processing (Stripe):</strong> Online credit/debit transactions, subscriptions, and receipts are processed directly by our secure payment provider, Stripe. Card numbers, CVC tokens, and bank account credentials do not touch or reside on CareerCraft servers. Stripe is certified as a PCI-DSS Level 1 service provider.</li>
          <li><strong>Manual Deposits & Wantok Transfers (Papua New Guinea Local Payments):</strong> For users who utilize manual banking options—including Bank of South Pacific (BSP) Mobile Banking, Wantok Wallet, SMS payment tokens, or internet banking deposits—we collect billing identifiers. This includes your self-declared receipt number, payment date, plan upgraded, amount, and the uploaded receipt image. This evidence is held within segregated private directories on our servers, scanned automatically, and utilized strictly to verify eligibility and manage administrative auditing.</li>
        </ul>

        <h3>c. Digital Analytics & Telemetry</h3>
        <p>We register standard structural technical data, including IP addresses, device configuration formats, browser headers, and page activity timestamps. This is utilized to run automated security firewalls and compute performance metrics.</p>
        
        <h2>3. Detailed Data Usage Practices</h2>
        <p>All stored personal files are mapped specifically for user benefit. We utilize this information to:</p>
        <ul>
          <li>Build and structure your personal resume models, cover letters, and analytical documents.</li>
          <li>Operate the Yewo AI co-pilot. Yewo processes user prompts, targeted job alerts, and resume bullets to output active phrase corrections, ATS compatibility estimates, and real-time formatting guidelines.</li>
          <li>Accurately manage payments, confirm local deposits, and audit historical account ledger lines.</li>
          <li>Adhere to governmental tax rules and verify transaction validity.</li>
        </ul>

        <h2>4. Data Sharing & Third-Party Pipeline Protection</h2>
        <p>CareerCraft does not rent or sell user personal files. Your resume text, job qualifications, and user queries are shared strictly with essential operations pipelines under strict security provisions:</p>
        <ul>
          <li><strong>Google Cloud Platform & Google Gemini API:</strong> The conversational features and resume analyses provided by Yewo AI run via secure, private enterprise connections to Google Gemini. All transmissions utilize TLS/SSL transport security. In accordance with enterprise Google Gemini API guidelines, <strong>your prompts, resume text, uploaded files, and job descriptions are processed as stateful query items and are NEVER logged, cached, or utilized by Google or any third parties to train baseline model algorithms.</strong> Your career details remain entirely yours.</li>
          <li><strong>Stripe Payments:</strong> To pass metadata matching user subscriptions securely.</li>
        </ul>

        <h2>5. Your Rights & Native Self-Service Controls</h2>
        <p>CareerCraft values user autonomy over their professional records. Regardless of physical location, we extend advanced security and privacy controls modeled after the EU General Data Protection Regulation (<strong>GDPR</strong>) and the California Consumer Privacy Act (<strong>CCPA</strong>), implemented as native, clickable self-service actions directly within your dashboard:</p>
        <ul>
          <li><strong>Right of Absolute Access & Portability (Export Data):</strong> Inside your <strong>Account settings</strong> page, you can instantly export a structured, human-readable file containing your complete profile, CV outlines, and historical interactions for transport to other services.</li>
          <li><strong>Right of Absolute Erasure (Delete Account):</strong> You can instantly purge your entire career footprint. Triggering the <strong>Delete Account</strong> action in your <strong>Account settings</strong> causes the software to execute automated, irreversible database wipes. Your resume records, cover letters, uploaded files, analysis metrics, and session histories are permanently deleted.</li>
          <li><strong>Right of Rectification:</strong> You maintain continuous, direct override access to modify and update all fields in active items.</li>
        </ul>
        <p>For more specific legal enquiries, please email our privacy compliance desk directly at <a href="mailto:support@careercraft.example" className="text-indigo-600 hover:underline">support@careercraft.example</a>.</p>
        
        <h2>6. Targeted Data Retention Limits</h2>
        <p>We preserve personal attributes only for the duration required to meet technical, billing, and regulatory guidelines:</p>
        <ul>
          <li><strong>Active Workspace:</strong> Stored resume components are kept for as long as your workspace remains registered. Verified accounts idle for over 12 consecutive months are flagged as inactive, and we will send prior warnings before removing underlying database records.</li>
          <li><strong>Manual Verification Receipt Uploads:</strong> Payment proofs, transaction screenshots, and reference receipt strings submitted by local BSP/Wantok users are securely preserved for a standard financial audit period of 12 months following receipt, allowing us to reconcile PNG tax ledgers. Following this 12-month legal audit ceiling, receipt files are permanently hard-deleted.</li>
          <li><strong>Trial Grace Ledger:</strong> To prevent ongoing system abuse of the manual instant-activation grace period, we retain basic hashes of transaction IDs to check historical repetition thresholds.</li>
        </ul>

        <h2>7. Legal Compliance & Security Integrity</h2>
        <p>CareerCraft operates under modern cybersecurity practices to safeguard private folders. While we enforce TLS/SSL communication paths and encrypted server environments, no platform is completely impervious to risk. We ensure compliance with Papua New Guinea electronic security acts (including the <em>Digital Transactions Act 2020</em> and the <em>Cybercrime Code Act 2016</em>), preventing unauthorized data intrusion and maintaining verified audits. If a security event is detected, impacted parties will be directly notified within 72 hours of verification.</p>
      </div>
    </div>
  );
}

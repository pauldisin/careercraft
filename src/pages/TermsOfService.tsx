import React from 'react';
import SEO from '../components/SEO';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Terms of Service & User Agreement | CareerCraft" 
        description="Review the legally binding conditions, subscription rules, and service agreements governing CareerCraft's AI resume systems, templates, and advisors." 
      />
      <div className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1 className="font-serif text-4xl mb-8">Terms of Service</h1>
        <p className="text-sm italic text-slate-500">Last updated: April 22, 2026</p>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/30 p-5 rounded-2xl mb-8 font-sans">
          <p className="text-xs text-emerald-900 dark:text-emerald-350 leading-relaxed m-0 font-medium font-sans">
            <strong>📋 Professional Service Agreement:</strong> These Terms of Service constitute a fully verified, legally binding agreement between you and CareerCraft. This framework governs our AI resume engines, Yewo co-pilot sequences, real-time PDF compilers, and manual BSP/Wantok billing systems to guarantee compliance with regional standards and fair utilization rules.
          </p>
        </div>

        <h2>1. Acceptance of Terms</h2>
        <p>By registering or using CareerCraft, you agree to be bound by these Terms. If you do not agree, please do not use our services.</p>

        <h2>2. Acceptable Use</h2>
        <p>You agree not to use CareerCraft to create fraudulent documents, infringe on third-party intellectual property, or engage in any unlawful activity.</p>

        <h2>3. Accounts, Billing, & Credit System</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. We provide both subscription-based tiers and a "Pay As You Go" credit-based system:</p>
        
        <h3>a. Subscription & Pay As You Go Credits</h3>
        <ul>
          <li><strong>Credit Consumption:</strong> "Pay As You Go" credits are purchased in packages. Credits are deducted from your balance upon launching premium sequences (e.g., 1 Credit for a Basic scan or single-template compile, 3 Credits for a complete Bundle analysis or premium export packages).</li>
          <li><strong>Expiration Policy:</strong> Unless explicitly noted differently under a custom corporate package, purchased credits are valid for a duration of twelve (12) months from the exact date of purchase. Unused credits after this window are automatically deprecated and expire.</li>
          <li><strong>Non-Refundability:</strong> All standard digital payments, including credit package purchases, are non-refundable except in jurisdictions where refund protocols are mandatory under local consumer protection law.</li>
        </ul>

        <h3>b. Manual Payment Verification (Local Bank / Wantok Pay)</h3>
        <p>For regions or users selecting our alternative manual settlement route (such as Local Bank Transfer or Wantok Pay):</p>
        <ul>
          <li><strong>Prerequisite verification:</strong> To upgrade your account manually, you must submit a valid receipt photo or transfer screenshot along with the exact transaction reference identifier in the billing screen.</li>
          <li><strong>Verification Timeline:</strong> Manual deposits undergo active administrative reconciliation. Standard processing and authorization take between twenty-four (24) and forty-eight (48) business hours from the moment of your submission.</li>
          <li><strong>Disapproval Criteria & Remedies:</strong> Submissions with ambiguous, duplicated, or unreadable receipts will be rejected. If your upgrade request is denied, you may appeal by submitting an updated ledger screenshot or contacting our billing desk at <a href="mailto:billing@careercraft.example" className="text-amber-700 hover:underline">billing@careercraft.example</a>.</li>
        </ul>

        <h2>4. Artificial Intelligence ("AI") Output Disclaimer</h2>
        <p>CareerCraft utilizes advanced machine learning systems and external text processors (including Google Gemini models) to recommend text enhancements, generate summaries, and analyze resume metadata.</p>
        <ul>
          <li><strong>As-Is Provisioning:</strong> All AI-generated content, layout options, template formatting suggestions, and analysis scores are provided strictly "as is" and "as available". We do not guarantee accuracy, professional fit, completeness, or reliability of any suggested statements.</li>
          <li><strong>Individual Review:</strong> You acknowledge that AI systems occasionally generate inaccurate or biased information ("hallucinations"). It is your sole responsibility to review, fact-check, synthesize, and edit your resumes or cover letters for total truthfulness and accuracy before presenting them to prospective employers or uploading them to applicant screening systems.</li>
          <li><strong>No Employment Guarantee:</strong> Use of our automated templates or AI optimization indicators does not compile any guarantee of successful employment, candidate interviews, or performance score matches.</li>
        </ul>

        <h2>5. Limitation of Liability</h2>
        <p>To the maximum extent permitted by applicable law, CareerCraft, its operators, or service partners shall not be held liable for any direct, indirect, incidental, special, or consequential damages resulting from (i) your utilization of the templates; (ii) any errors, hallucinated text, or factual discrepancies within your compiled resumes; or (iii) any delay/denial in manual billing reconciliations.</p>

        <h2>6. Governing Law</h2>
        <p>These terms shall be governed by and construed in accordance with the laws applicable to our place of business.</p>
      </div>
    </div>
  );
}

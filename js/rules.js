const pfrfsRules = [
  {
    id: 'rule1',
    question: 'What type of entity are you?',
    options: [
      {
        answer: 'Small and Medium-sized Entity (SME)',
        result: 'PFRS for SMEs',
        icon: '🏢',
        explanation: 'You should apply the **PFRS for SMEs** framework. It is a simplified version of full PFRS, designed specifically for entities that do not have public accountability.'
      },
      {
        answer: 'Large Corporation / Publicly Accountable',
        result: 'Full PFRS',
        icon: '🏦',
        explanation: 'You must apply the **full Philippine Financial Reporting Standards (PFRS)**. These are based on IFRS and are required for all entities with public accountability, such as listed companies and banks.'
      }
    ]
  },
  {
    id: 'rule2',
    question: 'Are you dealing with revenue recognition?',
    options: [
      {
        answer: 'Yes, from contracts with customers',
        result: 'PFRS 15',
        icon: '📄',
        explanation: '**PFRS 15: Revenue from Contracts with Customers** applies. It provides a 5-step model: 1) Identify the contract, 2) Identify performance obligations, 3) Determine transaction price, 4) Allocate price, 5) Recognize revenue when obligations are satisfied.'
      },
      {
        answer: 'No, not related to customer contracts',
        result: 'Other standard',
        icon: '📋',
        explanation: 'Revenue from sources other than customer contracts (like interest, dividends, or leases) is covered by **other specific PFRS standards**. Please select another question.'
      }
    ]
  },
  {
    id: 'rule3',
    question: 'Do you have financial instruments?',
    options: [
      {
        answer: 'Yes, investments, loans, or derivatives',
        result: 'PFRS 9',
        icon: '💰',
        explanation: '**PFRS 9: Financial Instruments** governs classification, measurement, impairment, and hedge accounting. It introduced the expected credit loss model for impairment.'
      },
      {
        answer: 'No financial instruments',
        result: 'Not applicable',
        icon: '✅',
        explanation: 'PFRS 9 does not apply to your situation. No further action needed for financial instruments.'
      }
    ]
  },
  {
    id: 'rule4',
    question: 'Are you involved in leasing?',
    options: [
      {
        answer: 'Yes, as a lessee (renting property/equipment)',
        result: 'PFRS 16',
        icon: '🏠',
        explanation: '**PFRS 16: Leases** requires lessees to recognize almost all leases on the balance sheet as a right-of-use asset and a lease liability. There are limited exceptions for short-term and low-value leases.'
      },
      {
        answer: 'Yes, as a lessor (leasing out property)',
        result: 'PFRS 16',
        icon: '🏗️',
        explanation: '**PFRS 16** for lessors retains a dual classification model: operating leases and finance leases. The accounting treatment differs significantly between them.'
      },
      {
        answer: 'No leasing activities',
        result: 'Not applicable',
        icon: '✅',
        explanation: 'PFRS 16 does not apply. No lease accounting needed.'
      }
    ]
  }
];
